import { GenericServer } from '../../GenericServer';

export class UninstallTemplate {
	static cmd: string = "aventus.template.uninstall";



	public static async run() {
		await GenericServer.templateManager?.selectTemplateToUninstall();
	}
}