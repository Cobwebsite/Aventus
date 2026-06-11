import { CancellationToken, CustomTextEditorProvider, Disposable, ExtensionContext, Range, TextDocument, Uri, Webview, WebviewPanel, window, workspace, WorkspaceEdit } from 'vscode';
import { getNonce } from '../tool';
import { normalize } from 'path';
import { readFileSync } from 'fs';
import { Communication } from './_Communication';

export class AventusDBEditor implements CustomTextEditorProvider {

	public static register(context: ExtensionContext): Disposable {
		const provider = new AventusDBEditor(context);
		const providerRegistration = window.registerCustomEditorProvider(AventusDBEditor.viewType, provider, {
			webviewOptions: {
				retainContextWhenHidden: true
			}
		});
		return providerRegistration;
	}

	private static readonly viewType = 'aventus.db';

	public static filtersByUri: { [uri: string]: string } = {};

	private static panelsByUri: { [uri: string]: WebviewPanel } = {};

	public static close(uri: string) {
		if (this.panelsByUri[uri]) {
			this.panelsByUri[uri].dispose();
		}
	}

	constructor(
		private readonly context: ExtensionContext
	) { }


	public async resolveCustomTextEditor(
		document: TextDocument,
		panel: WebviewPanel,
		_token: CancellationToken
	): Promise<void> {

		panel.iconPath = Uri.joinPath(this.context.extensionUri, 'icons', 'icon.png');
		panel.webview.options = {
			enableScripts: true,
		};


		let initialFilter: string | undefined = undefined;
		let docUri = document.uri.toString();
		if (AventusDBEditor.filtersByUri[docUri]) {
			initialFilter = AventusDBEditor.filtersByUri[docUri];
			delete AventusDBEditor.filtersByUri[docUri];
		}
		AventusDBEditor.panelsByUri[docUri] = panel;
		panel.onDidDispose((e) => {
			delete AventusDBEditor.panelsByUri[docUri];
		})

		this.setHtmlForWebview(this.context, panel.webview);

		const comm = new Communication(document, panel.webview);

		let prevent = false;
		let version = -1;
		comm.addRouteWithResponse<{}, Schema>({
			channel: "getData",
			callback: async (data, params, uid) => {
				return JSON.parse(document.getText())
			}
		})

		comm.addRouteWithResponse<void, boolean>({
			channel: "save",
			callback: async (data, params, uid) => {
				await document.save();
				return true;
			}
		})

		comm.addRouteWithResponse<Schema, boolean>({
			channel: "triggerChange",
			callback: async (data, params, uid) => {
				prevent = true;
				await this.triggerChange(data, document);
				return true;
			}
		})

		workspace.onDidChangeTextDocument(async (e) => {
			if (e.document.uri.toString() === document.uri.toString()) {
				comm.send({
					channel: "is_dirty",
					body: document.isDirty
				})

				if (prevent) {
					prevent = false;
					version = document.version;
					return;
				}
				if (document.version == version) return;
				version = document.version;

				let content: any = {};
				try {
					content = JSON.parse(document.getText())
				}
				catch { }
				comm.send({
					channel: "update_content",
					body: content
				})
			}
		})
		workspace.onDidSaveTextDocument(async (doc) => {
			if (doc.uri.toString() === document.uri.toString()) {
				comm.send({
					channel: "is_dirty",
					body: false
				})
			}
		})
	}

	protected triggerChange(value: Schema, document: TextDocument) {
		const txt = JSON.stringify(value, null, 4);
		const edit = new WorkspaceEdit();
		edit.replace(
			document.uri,
			new Range(0, 0, document.lineCount, 0),
			txt
		);
		return workspace.applyEdit(edit);
	}


	/**
	 * Get the static html used for the editor webviews.
	 */
	private setHtmlForWebview(context: ExtensionContext, webview: Webview): void {
		// Local path to script and css for the webview

		let viewUrl = webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'client', 'views', 'db')).toString();

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();
		let realPath = normalize(Uri.joinPath(context.extensionUri, 'client', 'views', 'db', 'index.html').path.slice(1));
		let txt = readFileSync(realPath, 'utf8');
		txt = txt.replace(/~/g, viewUrl);
		txt = txt.replace(/\$nonce/g, nonce);
		txt = txt.replace(/\$csp/g, webview.cspSource);
		webview.html = txt
	}


}

export interface FieldType {
	id: string;
	name: string;
}

export interface Field {
	id: string;
	name: string;
	type: FieldType;
	primaryKey?: boolean;
}

export interface Table {
	id: string;
	name: string;
	schema: string;
	x: number;
	y: number;
	color: string;
	locked: boolean;
	fields: Field[];
}

export interface Relationship {
	id: string;
	name: string;
	sourceTableId: string;
	targetTableId: string;
	sourceFieldId: string;
	targetFieldId: string;
}

export interface Area {
	id: string;
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
	color: string;
	locked: boolean;
}

export interface Schema {
	id: string;
	name: string;
	databaseType: string;
	tables: Table[];
	relationships: Relationship[];
	areas: Area[];
}