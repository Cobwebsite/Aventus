import { GenericServer } from '../GenericServer';

export class ReloadSettings {
	static cmd: string = "aventus.reloadSettings";

	public static async run() {
		GenericServer.refreshSettings();
	}
}