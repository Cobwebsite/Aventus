import { ClientConnection } from '../Connection';

export class OpenFile {

	public static send(uri: string) {
		ClientConnection.getInstance().sendNotification("aventus/openfile", uri);
	}
}