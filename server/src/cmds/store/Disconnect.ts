import { GenericServer } from '../../GenericServer';
import { Store } from '../../store/Store';

export class StoreDisconnect {
	static cmd: string = "aventus.store.disconnect";

	public static async run() {
		if (!Store.isConnected) {
			return;
		}
		await Store.disconnect();
		GenericServer.showInformationMessage("You are disconnected");
	}
}
