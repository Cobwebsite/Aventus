import { TextDocument, Webview } from 'vscode';

export interface Route<T = any, U = void> {
	channel: string;
	callback: (data: T, params: UriParamsValue, uid?: string) => Promise<U> | U;
}

export type InternalRoute<T = any, U = void> = Route<T, U> & {
	regex: RegExp;
	params: UriParams[];
	withResponse: boolean;
}
export interface Options<T = any> {
	channel: string,
	body?: T,
	timeout?: number,
	uid?: string;
}
export interface Message {
	channel: string;
	data?: any;
	uid?: string;
}

export class Communication {
	protected waitingList: { [uuid: string]: (channel: string, data: any) => void; } = {};

	private routes: { [key: string]: InternalRoute<any, any>[]; } = {};

	public constructor(
		private document: TextDocument,
		private webview: Webview
	) {
		webview.onDidReceiveMessage(e => this.onMessage(e));
	}

	public sendWithResponse<T>(options: Options): Promise<T | null> {
		return new Promise<T | null>(async (resolve) => {
			try {
				let _uid = options.uid ? options.uid : this.uuidv4();
				options.uid = _uid;
				// No need to have an event listening bc the waiting list is trigger event if no event is listening
				let timeoutInfo: NodeJS.Timeout | undefined;
				this.waitingList[_uid] = (channel, data) => {
					clearTimeout(timeoutInfo);
					if (channel.toLowerCase() != options.channel.toLowerCase()) {
						console.error(`We sent a message on ${options.channel} but we receive on ${channel}`);
						resolve(null);
					}
					else {
						resolve(data);
					}
				};
				if (options.timeout !== undefined) {
					timeoutInfo = setTimeout(() => {
						delete this.waitingList[_uid];
						console.error("No message received after " + options.timeout + "ms");
						resolve(null);
					}, options.timeout);
				}

				this.send(options);
			} catch (e) {
				console.error(e);
				resolve(null);
			}
		});
	}

	public send(options: Options): void {
		let message: Message = {
			channel: options.channel,
		};
		if (options.uid) {
			message.uid = options.uid;
		}

		if (options.body) {
			message.data = options.body;
		}

		this.webview.postMessage(message);
	}

	private async onMessage(data: any) {
		const message: Message = data;

		for (let channel in this.routes) {
			let current = this.routes[channel];
			for (let info of current) {
				let params = Uri.getParams(info, message.channel);
				if (params) {
					const result = await info.callback(data.data, params, message.uid);
					if(info.withResponse) {
						this.send({
							channel: message.channel,
							uid: message.uid,
							body: result
						})
					}
				}
			}
		}
	}

	public addRoute<T = any>(route: Route<T>): void {
		this._addRoute(route, false);
	}
	public addRouteWithResponse<T = any, U = void>(route: Route<T, U>): void {
		this._addRoute(route, true);
	}
	private _addRoute<T = any, U = void>(route: Route<T, U>, withResponse: boolean): void {
		if (!this.routes.hasOwnProperty(route.channel)) {
			this.routes[route.channel] = [];
		}

		// prevent double subscribe 
		for (let info of this.routes[route.channel]) {
			if (info.callback == route.callback) {
				return;
			}
		}

		const { params, regex } = Uri.prepare(route.channel);
		let prepared: InternalRoute<T, U> = {
			callback: route.callback,
			channel: route.channel,
			regex,
			params,
			withResponse: withResponse
		};
		this.routes[route.channel].push(prepared);
	}

	public removeRoute(route: Route): void {
		for (let i = 0; i < this.routes[route.channel].length; i++) {
			let info = this.routes[route.channel][i];
			if (info.callback == route.callback) {
				this.routes[route.channel].splice(i, 1);
				i--;
			}
		}
	}

	protected uuidv4(): string {
		let uid = '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
			(Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16)
		);
		return uid;
	}
}

type UriParamsValue = {
	[paramName: string]: string | number;
};
type UriParams = {
	name: string;
	type: "number" | "string";
	position: number;
};
type PreparedUri = {
	regex: RegExp;
	params: UriParams[];
}
export class Uri {

	public static prepare(uri: string): PreparedUri {
		let params: UriParams[] = [];
		let i = 0;
		let regexState = uri.replace(/{.*?}/g, (group, position) => {
			group = group.slice(1, -1);
			let splitted = group.split(":");
			let name = splitted[0].trim();
			let type: "number" | "string" = "string";
			let result = "([^\\/]+)";
			i++;

			if (splitted.length > 1) {
				if (splitted[1].trim() == "number") {
					result = "([0-9]+)";
					type = "number";
				}
			}

			params.push({
				name,
				type,
				position: i
			});
			return result;
		});
		regexState = regexState.replace(/\*/g, ".*?").toLowerCase();
		regexState = "^" + regexState + '$';

		return {
			regex: new RegExp(regexState),
			params
		};
	}

	public static getParams(from: string | PreparedUri, current: string): UriParamsValue | null {
		if (typeof from == "string") {
			from = this.prepare(from);
		}

		let matches = from.regex.exec(current.toLowerCase());
		if (matches) {
			let slugs: UriParamsValue = {};
			for (let param of from.params) {
				if (param.type == "number") {
					slugs[param.name] = Number(matches[param.position]);
				}
				else {
					slugs[param.name] = matches[param.position];
				}
			}
			return slugs;
		}
		return null;
	}

	public static isActive(from: string | PreparedUri, current: string): boolean {
		if (typeof from == "string") {
			from = this.prepare(from);
		}

		return from.regex.test(current);
	}

	public static normalize(path: string) {
		const isAbsolute = path.startsWith('/');
		const parts = path.split('/');
		const normalizedParts: string[] = [];

		for (let i = 0; i < parts.length; i++) {
			if (parts[i] === '..') {
				normalizedParts.pop();
			} else if (parts[i] !== '.' && parts[i] !== '') {
				normalizedParts.push(parts[i]);
			}
		}

		let normalizedPath = normalizedParts.join('/');

		if (isAbsolute) {
			normalizedPath = '/' + normalizedPath;
		}

		return normalizedPath;
	}
}