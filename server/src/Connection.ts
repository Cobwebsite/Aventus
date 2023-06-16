import { createConnection, ProposedFeatures, PublishDiagnosticsParams, _, _Connection } from 'vscode-languageserver/node';
import { uriToPath } from './tools';
import { join } from 'path';




export class ClientConnection {
	private static instance: ClientConnection;
	private appData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
	private _fsPath: string = join(this.appData, "aventus");
	public static getInstance(): ClientConnection {
		if (!this.instance) {
			this.instance = new ClientConnection();
		}
		return this.instance;
	}

	private _connection: _Connection<_, _, _, _, _, _, _> | undefined = undefined;
	public get connection() {
		return this._connection;
	}
	private constructor() {
		// create connection with vscode client
		if (!process.env["AVENTUS_CLI"]) {
			this._connection = createConnection(ProposedFeatures.all);
		}
	}

	public setFsPath(path: string) {
		this._fsPath = path;
	}
	public getFsPath(): string {
		return this._fsPath;
	}
	public isCLI(): boolean {
		if (!process.env["AVENTUS_CLI"]) {
			return false;
		}
		return true;
	}
	public isDebug(): boolean {
		if (!process.env["DEBUG"]) {
			return false;
		}
		return true;
	}
	public sendNotification(cmd: string, params: any) {
		if (this._connection) {
			this._connection.sendNotification(cmd, params);
		}
		else {
			if (cmd == "aventus/compiled") {
				console.log("done");
			}
		}

	}
	public showErrorMessage(msg) {
		if (this._connection) {
			this._connection.window.showErrorMessage(msg);
		}
		else {
			console.error("Error : " + msg);
		}

	}
	public sendDiagnostics(params: PublishDiagnosticsParams) {
		if (this._connection) {
			this._connection?.sendDiagnostics(params)
		}
		else {
			let path = uriToPath(params.uri);
			for (let diagnostic of params.diagnostics) {
				console.log("Error : " + path + ":" + diagnostic.range.start.line + ":" + diagnostic.range.start.character + " : " + diagnostic.message)
			}
		}
	}
}