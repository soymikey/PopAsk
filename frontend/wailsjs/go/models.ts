export namespace main {
	
	export class ChatResponse {
	    code: number;
	    data: any;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new ChatResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.code = source["code"];
	        this.data = source["data"];
	        this.message = source["message"];
	    }
	}
	export class Gist {
	    description: string;
	    public: boolean;
	    files: any;
	
	    static createFrom(source: any = {}) {
	        return new Gist(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.description = source["description"];
	        this.public = source["public"];
	        this.files = source["files"];
	    }
	}

}

