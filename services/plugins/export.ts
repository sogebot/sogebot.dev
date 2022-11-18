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
    plugin: string;
    version: number;
    importedCount: number;
    compatibleWith: string;
    votes: PluginVote[];

    constructor(source: any = {}) {
        if ('string' === typeof source) source = JSON.parse(source);
        this.id = source["id"];
        this.name = source["name"];
        this.description = source["description"];
        this.publisherId = source["publisherId"];
        this.publishedAt = source["publishedAt"];
        this.plugin = source["plugin"];
        this.version = source["version"];
        this.importedCount = source["importedCount"];
        this.compatibleWith = source["compatibleWith"];
        this.votes = this.convertValues(source["votes"], PluginVote);
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