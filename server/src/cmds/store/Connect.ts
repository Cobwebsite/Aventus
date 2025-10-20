import { GenericServer } from '../../GenericServer';
import { Store } from '../../store/Store';

export class StoreConnect {
	static cmd: string = "aventus.store.connect";

	public static async run() {

		if (Store.isConnected) {
			await GenericServer.showInformationMessage("You are already connected with account " + Store.settings.username)
			return;
		}

		const username = await GenericServer.Input({ title: "Username" });
		if (!username) return;
		const password = await GenericServer.Input({ title: "Password", password: true });
		if (!password) return;
		
		const result = await Store.connect(username, password);
		if (result) {
			await GenericServer.showInformationMessage("Connection successful");
		}
		else {
			await GenericServer.showErrorMessage("Connection failed");
		}
	}
}
