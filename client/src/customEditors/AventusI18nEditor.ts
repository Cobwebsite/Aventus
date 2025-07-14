import { CancellationToken, CustomTextEditorProvider, Disposable, ExtensionContext, Range, TextDocument, Uri, Webview, WebviewPanel, window, workspace, WorkspaceEdit } from 'vscode';
import { getNonce } from '../tool';
import { normalize } from 'path';
import { readFileSync } from 'fs';
import { Communication } from './_Communication';
import { SourceLanguageCode, TargetLanguageCode, Translator } from 'deepl-node';
import { SettingsManager } from '../Settings';
import { GetLocales } from '../communication/i18n/GetLocales';
import { Singleton } from '../Singleton';

export class AventusI18nEditor implements CustomTextEditorProvider {

	public static register(context: ExtensionContext): Disposable {
		const provider = new AventusI18nEditor(context);
		const providerRegistration = window.registerCustomEditorProvider(AventusI18nEditor.viewType, provider, {
			webviewOptions: {
				retainContextWhenHidden: true
			}
		});
		return providerRegistration;
	}

	private static readonly viewType = 'aventus.i18n';

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
		if (AventusI18nEditor.filtersByUri[docUri]) {
			initialFilter = AventusI18nEditor.filtersByUri[docUri];
			delete AventusI18nEditor.filtersByUri[docUri];
		}
		AventusI18nEditor.panelsByUri[docUri] = panel;
		panel.onDidDispose((e) => {
			delete AventusI18nEditor.panelsByUri[docUri];
		})

		this.setHtmlForWebview(this.context, panel.webview);

		const comm = new Communication(document, panel.webview);

		let prevent = false;
		let version = -1;
		comm.addRouteWithResponse<{
			value: string,
			source: string,
			destination: string
		}, { error?: string, result?: string }>({
			channel: "translate",
			callback: async (data, params, uid) => {
				return await this.translate(data.value, data.source, data.destination);
			}
		})

		comm.addRouteWithResponse<AventusI18nFileSrcParsed, boolean>({
			channel: "triggerChange",
			callback: async (data, params, uid) => {
				prevent = true;
				await this.triggerChange(data, document);
				return true;
			}
		})

		comm.addRouteWithResponse<void, boolean>({
			channel: "save",
			callback: async (data, params, uid) => {
				await document.save();
				return true;
			}
		})

		comm.addRouteWithResponse<void, { content: AventusI18nFileSrcParsed, locales: string[], filter: string | undefined, pageName: string }>({
			channel: "init",
			callback: async (data, params, uid) => {
				await Singleton.client.waitInit();
				const filter = initialFilter;
				initialFilter = undefined;
				let content: AventusI18nFileSrcParsed = {};
				try {
					version = document.version;
					content = JSON.parse(document.getText())
				}
				catch { }
				const locales = await GetLocales.execute(docUri) ?? [];
				const splitted = docUri.split('/');
				const pageName = splitted[splitted.length - 1].replace(/%40/g, "@");
				return {
					content,
					filter,
					locales,
					pageName
				};
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

				let content: AventusI18nFileSrcParsed = {};
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

	protected async translate(value: string, source: string, destination: string): Promise<{ error?: string, result?: string }> {
		const key = SettingsManager.getInstance().settings.deeplApiKey;
		if (!key) {
			return { error: "No api key" }
		}
		const translator = new Translator(key);
		const sourceCode = source.split('-')[0] as SourceLanguageCode;
		const destinationCode = destination.split('-')[0] as TargetLanguageCode;
		try {
			const result = await translator.translateText(value, sourceCode, destinationCode);
			return {
				result: result.text
			}
		} catch (e) {
			console.error("value : " + value);
			console.error("source : " + sourceCode);
			console.error("destination : " + destinationCode);
			console.error(e);
			return {
				error: e + ''
			}
		}

	}

	protected triggerChange(value: AventusI18nFileSrcParsed, document: TextDocument) {
		const txt = JSON.stringify(this.sortObj(value), null, 4);
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

		let viewUrl = webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'client', 'view', 'i18n')).toString();

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();
		let realPath = normalize(Uri.joinPath(context.extensionUri, 'client', 'view', 'i18n', 'index.html').path.slice(1));
		let txt = readFileSync(realPath, 'utf8');
		txt = txt.replace(/~/g, viewUrl);
		txt = txt.replace(/\$nonce/g, nonce);
		txt = txt.replace(/\$csp/g, webview.cspSource);
		webview.html = txt
	}

	private sortObj(unordered: AventusI18nFileSrcParsed) {
		const ordered = Object.keys(unordered).sort().reduce(
			(obj, key) => {
				const temp = unordered[key];
				obj[key] = Object.keys(temp).sort().reduce(
					(obj2, key) => {
						obj2[key] = temp[key];
						return obj2;
					},
					{}
				);

				return obj;
			},
			{}
		);
		return ordered;
	}
}

export type AventusI18nFileSrcParsed = { [key: string]: { [locale: string]: string } };
export type I18nParsed = { [key: string]: I18nParsedItem; };
export type I18nParsedItem = {
	key: string,
	keyStart: number,
	keyEnd: number,
	locales: { [locale: string]: I18nParsedItemLocale; };
};
export type I18nParsedItemLocale = {
	locale: string,
	localeStart: number,
	localeEnd: number,

	value: string,
	valueStart: number,
	valueEnd: number,
};