export namespace main {
	
	export class ChatResponse {
	    code: number;
	    data: any;
	
	    static createFrom(source: any = {}) {
	        return new ChatResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.code = source["code"];
	        this.data = source["data"];
	    }
	}
	export class Prompt {
	    act: string;
	    prompt: string;
	    for_devs: string;
	
	    static createFrom(source: any = {}) {
	        return new Prompt(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.act = source["act"];
	        this.prompt = source["prompt"];
	        this.for_devs = source["for_devs"];
	    }
	}

}

