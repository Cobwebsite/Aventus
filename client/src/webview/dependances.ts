import { readFileSync } from 'fs';
import { normalize } from 'path';
import { ExtensionContext, Uri, ViewColumn, Webview, WebviewPanel, window } from 'vscode';

export class AventusDependancesView {

    public getView(context: ExtensionContext, uri: string): WebviewPanel {
        let panel = window.createWebviewPanel("avt-dependances-view", "Dependances", {
            viewColumn: ViewColumn.Active
        }, {
            enableScripts: true,
            retainContextWhenHidden: true
        });

        this.setHtmlForWebview(context, panel.webview, uri)
        return panel;
    }
    /**
     * Get the static html used for the editor webviews.
     */
    private setHtmlForWebview(context: ExtensionContext, webview: Webview, uri: string): void {
        // Local path to script and css for the webview

        let viewUrl = webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'client', 'views', 'configuration')).toString();

        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();
        let realPath = normalize(Uri.joinPath(context.extensionUri, 'client', 'views', 'configuration', 'index.html').path.slice(1));
        let txt = readFileSync(realPath, 'utf8');
        txt = txt.replace(/~/g, viewUrl);
        txt = txt.replace(/\$nonce/g, nonce);
        txt = txt.replace(/\$csp/g, webview.cspSource);
        webview.html = txt
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}