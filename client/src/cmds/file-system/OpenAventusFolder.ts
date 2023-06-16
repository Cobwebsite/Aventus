import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { platform } from 'os';
import { ExtensionContext } from 'vscode';




export class OpenAventusFolder {
	static cmd: string = "aventus.filesystem.openAventus";

	private static context: ExtensionContext;
	public static init(context: ExtensionContext) {
		this.context = context;
	}
	public static async middleware(args: any[]): Promise<any[] | null> {
		let storageUri = this.context.globalStorageUri;
		if (!existsSync(storageUri.fsPath)) {
			mkdirSync(storageUri.fsPath);
		}
		let explorer;
		switch (platform()) {
			case "win32": explorer = "explorer"; break;
			case "linux": explorer = "xdg-open"; break;
			case "darwin": explorer = "open"; break;
		}
		let argsCmd: string[] = [storageUri.fsPath];

		spawn(explorer, argsCmd, { detached: true }).unref();
		return null;
	}
}