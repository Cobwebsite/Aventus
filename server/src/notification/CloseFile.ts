import { GenericServer } from '../GenericServer';

export class CloseFile {

	public static send(uri: string) {
		GenericServer.sendNotification("aventus/closefile", uri);
	}
}