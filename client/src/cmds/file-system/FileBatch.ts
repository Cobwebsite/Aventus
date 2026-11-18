import { commands } from 'vscode';

export interface FileBatchChanges {
	created: string[];
	updated: string[];
	deleted: string[];
}

export class FileBatch {
	static cmd = 'aventus.filesystem.batch';

	static async middleware(args: any[]): Promise<any[]> {
		return [args[0]];
	}

	static execute(changes: FileBatchChanges) {
		commands.executeCommand(this.cmd, changes);
	}
}
