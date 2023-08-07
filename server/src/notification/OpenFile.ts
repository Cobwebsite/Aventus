import { GenericServer } from '../GenericServer';

export class OpenFile {

	public static send(uri: string) {
		GenericServer.sendNotification("aventus/openfile", uri);
	}
}