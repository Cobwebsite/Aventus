import { CancellationToken, CustomTextEditorProvider, Disposable, ExtensionContext, TextDocument, Uri, Webview, WebviewPanel, window } from 'vscode';
import { getNonce } from '../tool';
import { normalize } from 'path';
import { readFileSync } from 'fs';
import { Communication } from './_Communication';

export class AventusI18nEditor implements CustomTextEditorProvider {

	public static register(context: ExtensionContext): Disposable {
		const provider = new AventusI18nEditor(context);
		const providerRegistration = window.registerCustomEditorProvider(AventusI18nEditor.viewType, provider, {
			webviewOptions: {
				retainContextWhenHidden: true,
			}
		});
		return providerRegistration;
	}

	private static readonly viewType = 'aventus.i18n';

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


		this.setHtmlForWebview(this.context, panel.webview);

		const comm = new Communication(document, panel.webview);

		comm.addRoute({
			channel: "translate",
			callback: (data, params, uid) => {
				debugger;
				comm.send({
					channel: "translate",
					body: {
						result: "salut",
					},
					uid
				})
			}
		})
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
}