import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, normalize } from 'path';
import { ExtensionContext, Uri, ViewColumn, Webview, WebviewPanel, window, workspace } from 'vscode';
import { getNonce, uriToPath } from '../tool';
import { Communication } from '../customEditors/_Communication';
import { spawn } from 'child_process';
import { sqlSchema } from './migration_sql';

export type DBType = "mysql" | "mssql" | "postgresql" | "sqlite"
type DatabaseModel = {
	UUID: string,
	Type: DBType,
	Host: string,
	Path: string,
	Username: string,
	Password?: string,
	SavePassword: boolean,
	Database: string,
};
type DBFile = {
	source: DatabaseModel[],
	target: DatabaseModel[],
}

type QueryPayload = {
	Type: DBType,
	Host: string,
	Username: string,
	Password: string,
	Database: string,
	Query: string
}

export class AventusMigration {

	public getPreview(context: ExtensionContext): WebviewPanel {
		let panel = window.createWebviewPanel("avt-migration", "Migration", {
			viewColumn: ViewColumn.Active,
		}, {
			enableScripts: true,
			retainContextWhenHidden: true
		});

		this.setHtmlForWebview(context, panel.webview)

		const comm = new Communication(panel.webview);

		comm.addRouteWithResponse<{}, DBFile>({
			channel: "getDatabases",
			callback: async () => {
				return this.getDatabases(context)
			}
		})

		comm.addRoute<DBFile>({
			channel: "setDatabases",
			callback: async (data) => {
				const file = this.getFile();
				if (!file) return;

				const old = await this.getDatabases(context);

				for (let _type in data) {
					const type = _type as keyof DBFile
					for (let db of data[type]) {
						if (db.SavePassword) {
							await this.savePassword(context, db.UUID, db.Password ?? '')
							delete db.Password;
						}

						const index = old[type].findIndex(p => p.UUID == db.UUID);
						if (index != -1)
							old[type].splice(index, 1)
					}
				}

				for (let _type in old) {
					const type = _type as keyof DBFile
					for (let db of data[type]) {
						await this.deletePassword(context, db.UUID);
					}
				}

				const dir = dirname(file);
				if (!existsSync(dir)) {
					mkdirSync(dir, { recursive: true })
				}

				writeFileSync(file, JSON.stringify(data))
			}
		})

		comm.addRouteWithResponse<DatabaseModel, boolean>({
			channel: "testConnection",
			callback: async (data) => {
				const payload: QueryPayload = {
					Database: data.Database,
					Host: data.Host,
					Password: data.Password ?? '',
					Query: "SELECT 1 as result",
					Type: data.Type,
					Username: data.Username
				}
				try {
					const result = await this.executeDbQuery<{ result: number }>(payload);
					return result[0].result == 1;
				} catch (e) {
					return false;
				}
			}
		})

		comm.addRouteWithResponse<DatabaseModel, any>({
			channel: "getSchema",
			callback: async (data) => {
				const payload: QueryPayload = {
					Database: data.Database,
					Host: data.Host,
					Password: data.Password ?? '',
					Query: sqlSchema[data.Type],
					Type: data.Type,
					Username: data.Username
				}
				try {
					const result = await this.executeDbQuery<{ metadata_json_to_import: string }>(payload);
					return JSON.parse(result[0].metadata_json_to_import);
				} catch (e) {
					return undefined;
				}
			}
		})

		return panel;
	}

	private getFile(create: boolean = false) {
		if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
			const file = join(uriToPath(workspace.workspaceFolders[0].uri.toString()), ".aventus", "databases.json");
			return file;
		}
		return undefined;
	}

	private async getDatabases(context: ExtensionContext): Promise<DBFile> {
		const file = this.getFile();
		if (!file || !existsSync(file)) return {
			source: [],
			target: [],
		};

		const contentTxt = readFileSync(file, 'utf-8')
		const content = JSON.parse(contentTxt) as DBFile;
		for (let db of content.source) {
			if (db.SavePassword) {
				db.Password = await this.getPassword(context, db.UUID);
			}
		}
		for (let db of content.target) {
			if (db.SavePassword) {
				db.Password = await this.getPassword(context, db.UUID);
			}
		}
		return content;
	}

	private async savePassword(context: ExtensionContext, connectionId: string, password: string) {
		await context.secrets.store(`db_pass_${connectionId}`, password);
	}

	private async getPassword(context: ExtensionContext, connectionId: string): Promise<string | undefined> {
		return await context.secrets.get(`db_pass_${connectionId}`);
	}

	private async deletePassword(context: ExtensionContext, connectionId: string) {
		await context.secrets.delete(`db_pass_${connectionId}`);
	}

	private async executeDbQuery<T>(payload: QueryPayload) {
		return new Promise<T[]>((resolve, reject) => {
			// Remplace par le chemin vers ton binaire .NET compilé
			const child = spawn('dotnet', ['D:/Aventus/AvenutsSharp/DatabaseQuery/bin/Debug/net10.0/DatabaseQuery.dll']);

			let responseData = '';
			let errorData = '';

			// On écrit le payload JSON dans le stdin du process C#
			child.stdin.write(JSON.stringify(payload));
			child.stdin.end();

			// On écoute la réponse sur stdout
			child.stdout.on('data', (data) => {
				responseData += data.toString();
			});

			// On écoute les erreurs système potentielles (ex: crash du binaire)
			child.stderr.on('data', (data) => {
				errorData += data.toString();
			});

			child.on('close', (code) => {
				if (code !== 0) {
					reject(new Error(`Le processus .NET a quitté avec le code ${code}: ${errorData}`));
					return;
				}

				try {
					const result = JSON.parse(responseData) as {
						Success: boolean,
						Result: T[],
						Errors: string[]
					};
					if (result.Success) {
						resolve(result.Result);
					} else {
						reject(new Error(result.Errors.join(",")));
					}
				} catch (e) {
					reject(new Error("Impossible de parser la réponse JSON du binaire .NET"));
				}
			});
		});
	}

	private setHtmlForWebview(context: ExtensionContext, webview: Webview): void {
		// Local path to script and css for the webview

		let viewUrl = webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'client', 'views', 'migration')).toString();

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();
		let realPath = normalize(Uri.joinPath(context.extensionUri, 'client', 'views', 'migration', 'index.html').path.slice(1));
		let txt = readFileSync(realPath, 'utf8');
		txt = txt.replace(/~/g, viewUrl);
		txt = txt.replace(/\$nonce/g, nonce);
		txt = txt.replace(/\$csp/g, webview.cspSource);
		webview.html = txt
	}
}
