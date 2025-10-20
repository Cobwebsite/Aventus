import { Settings, SettingsManager } from '../Settings';

export class SetSettings {
	public static cmd: string = "aventus/setsettings";

	public static async action(settings: Partial<Settings>, global: boolean) {
		SettingsManager.getInstance().setSettings(settings, global);
	}
}