import { commands, Uri, window } from 'vscode';

export class OpenFile {
	static cmd: string = "aventus.i18n.open";

	public static async middleware(args: any): Promise<void> {
		const uri = Uri.file(args.fsPath);
		const el = window.activeTextEditor;
		if (el) {
			await commands.executeCommand('vscode.openWith', uri, 'aventus.i18n');
		}
		else {
			await commands.executeCommand('vscode.openWith', uri, 'default');
		}
		// new AventusI18nWebview().getPreview(Singleton.client.context, uri);
	}
}