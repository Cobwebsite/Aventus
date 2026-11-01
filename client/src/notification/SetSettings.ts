import { Settings, SettingsManager } from '../Settings';

export class SetSettings {
	public static cmd: string = "aventus/setsettings";

	public static async action(settings: Partial<Settings>, global: boolean) {
		await SettingsManager.getInstance().setSettings(settings, global);
	}
}