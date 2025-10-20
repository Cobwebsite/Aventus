import { GenericServer } from '../../GenericServer';

export class UninstallProject {
	static cmd: string = "aventus.template.uninstall_project";



	public static async run() {
		await GenericServer.templateManager?.selectProjectToUninstall();
	}
}