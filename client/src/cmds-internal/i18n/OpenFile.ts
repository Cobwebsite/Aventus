import { commands, Uri, window } from 'vscode';
import { AventusI18nEditor } from '../../customEditors/AventusI18nEditor';

export class OpenFile {
	static cmd: string = "aventus.i18n.open";

	public static async middleware(args: any): Promise<void> {
		const uri = Uri.file(args.fsPath);
		const el = window.activeTextEditor;
		if (el) {
			await commands.executeCommand('workbench.action.closeActiveEditor');
			await commands.executeCommand('vscode.openWith', uri, 'aventus.i18n');
		}
		else {
			AventusI18nEditor.close(args.toString());
			await commands.executeCommand('vscode.openWith', uri, 'default');
		}
		// new AventusI18nWebview().getPreview(Singleton.client.context, uri);
	}
}