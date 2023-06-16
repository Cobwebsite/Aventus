import { ClientConnection } from '../Connection';

export class CloseFile {

	public static send(uri: string) {
		ClientConnection.getInstance().sendNotification("aventus/closefile", uri);
	}
}