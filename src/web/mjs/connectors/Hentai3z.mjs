import WordPressMadara from './templates/WordPressMadara.mjs';

export default class Hentai3z extends WordPressMadara {

    constructor() {
        super();
        super.id = 'hentai3z';
        super.label = 'Hentai3z';
        this.tags = [ 'manga', 'webtoon', 'hentai', 'english' ];
        this.url = 'https://hentai20.io';

        this.queryMangas = 'div.bsx a';
        this.queryChapters = 'div.eplister ul li div.chbox div.eph-num a';
        this.queryPages = 'div.wrapper script';

        this.requestOptions.headers.set('x-referer', this.url);
    }

    // Overwrite _createMangaRequest to adjust mange list url pattern
    _createMangaRequest(page) {
        return new Request(new URL(`/manga/?page=${page}`, this.url), this.requestOptions);
    }

    // Overwrite _getMangasFromPage to use attr title rather than text for manga name
    async _getMangasFromPage(page) {
        let request = this._createMangaRequest(page);
        let data = await this.fetchDOM(request, this.queryMangas);
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, request.url),
                title: element.title.trim()
            };
        });
    }

    // Overwrite _getPages to look for image in <script>
    async _getPages(chapter) {
        let uri = new URL(chapter.id, this.url);
        uri.searchParams.set('style', 'list');
        let request = new Request(uri, this.requestOptions);
        
        let data = await this.fetchDOM(request, this.queryPages);
        // HACK: Some Madara websites have added the '?style=list' pattern as CloudFlare WAF rule
        //       => Try without style parameter to bypass CloudFlare matching rule
        if (!data || !data.length) {
            uri.searchParams.delete('style');
            request = new Request(uri, this.requestOptions);
            data = await this.fetchDOM(request, this.queryPages);
        }
        // search for <script with content starting with ts_reader.run
        let output = []
        for (const element of data) {
            if (element.text.startsWith('ts_reader.run')) {
                let start = 14
                let end = element.text.length -2
                let scriptBloc = JSON.parse(element.text.substring(start,end))
                output = scriptBloc["sources"][0]["images"]
                break
            }
        }
        return output
    }


}
