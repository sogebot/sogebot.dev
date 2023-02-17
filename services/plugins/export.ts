/* Do not change, this code is generated from Golang structs */


export class PluginVote {
    id: string;
    userId: string;
    vote: number;

    constructor(source: any = {}) {
        if ('string' === typeof source) source = JSON.parse(source);
        this.id = source["id"];
        this.userId = source["userId"];
        this.vote = source["vote"];
    }
}
export class Plugin {
    id: string;
    name: string;
    description: string;
    publisherId: string;
    publishedAt: string;
    version: number;
    importedCount: number;
    compatibleWith: string;
    votes: PluginVote[];
    plugin: string;

    constructor(source: any = {}) {
        if ('string' === typeof source) source = JSON.parse(source);
        this.id = source["id"];
        this.name = source["name"];
        this.description = source["description"];
        this.publisherId = source["publisherId"];
        this.publishedAt = source["publishedAt"];
        this.version = source["version"];
        this.importedCount = source["importedCount"];
        this.compatibleWith = source["compatibleWith"];
        this.votes = this.convertValues(source["votes"], PluginVote);
        this.plugin = source["plugin"];
    }

	convertValues(a: any, classs: any, asMap: boolean = false): any {
	    if (!a) {
	        return a;
	    }
	    if (a.slice) {
	        return (a as any[]).map(elem => this.convertValues(elem, classs));
	    } else if ("object" === typeof a) {
	        if (asMap) {
	            for (const key of Object.keys(a)) {
	                a[key] = new classs(a[key]);
	            }
	            return a;
	        }
	        return new classs(a);
	    }
	    return a;
	}
}
export class OverlayVote {
    id: string;
    userId: string;
    vote: number;

    constructor(source: any = {}) {
        if ('string' === typeof source) source = JSON.parse(source);
        this.id = source["id"];
        this.userId = source["userId"];
        this.vote = source["vote"];
    }
}
export class Overlay {
    id: string;
    name: string;
    description: string;
    publisherId: string;
    publishedAt: string;
    version: number;
    importedCount: number;
    compatibleWith: string;
    votes: OverlayVote[];
    data: string;
    items: string;

    constructor(source: any = {}) {
        if ('string' === typeof source) source = JSON.parse(source);
        this.id = source["id"];
        this.name = source["name"];
        this.description = source["description"];
        this.publisherId = source["publisherId"];
        this.publishedAt = source["publishedAt"];
        this.version = source["version"];
        this.importedCount = source["importedCount"];
        this.compatibleWith = source["compatibleWith"];
        this.votes = this.convertValues(source["votes"], OverlayVote);
        this.data = source["data"];
        this.items = source["items"];
    }

	convertValues(a: any, classs: any, asMap: boolean = false): any {
	    if (!a) {
	        return a;
	    }
	    if (a.slice) {
	        return (a as any[]).map(elem => this.convertValues(elem, classs));
	    } else if ("object" === typeof a) {
	        if (asMap) {
	            for (const key of Object.keys(a)) {
	                a[key] = new classs(a[key]);
	            }
	            return a;
	        }
	        return new classs(a);
	    }
	    return a;
	}
}