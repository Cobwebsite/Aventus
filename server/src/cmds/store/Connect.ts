import { GenericServer } from '../../GenericServer';
import { Store } from '../../store/Store';

export class StoreConnect {
	static cmd: string = "aventus.store.connect";

	public static async run(username?: string | null, password?: string | null) {
		if (Store.isConnected) {
			await GenericServer.showInformationMessage("You are already connected with account " + Store.settings.username)
			return;
		}

		if (!username) {
			username = await GenericServer.Input({ title: "Username" });
			if (!username) return;
		}
		if (!password) {
			password = await GenericServer.Input({ title: "Password", password: true });
			if (!password) return;
		}
		console.log(username)
		console.log(password)

		const result = await Store.connect(username, password);
		if (result) {
			await GenericServer.showInformationMessage("Connection successful");
		}
		else {
			await GenericServer.showErrorMessage("Connection failed");
		}
	}
}
