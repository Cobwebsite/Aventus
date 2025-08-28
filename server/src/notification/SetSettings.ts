import { GenericServer } from '../GenericServer';
import { Settings } from '../settings/Settings';



export class SetSettings {
	public static send(settings: Partial<Settings>, global: boolean) {
		return new Promise<string | null>((resolve) => {
			GenericServer.sendNotification("aventus/setsettings", settings, global);
		})
	}
}