import { commands } from 'vscode';


export class EnableBuild {
	static cmd: string = "aventus.enableBuild";

	public static async middleware(args: any[]): Promise<void> {
		await commands.executeCommand(
			'workbench.action.openSettings',
			'aventus.ideBuild'
		);
	}
}