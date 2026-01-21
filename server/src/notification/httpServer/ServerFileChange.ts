import { GenericServer } from '../../GenericServer';

export class ServerFileChange {

	public static send(uri: string) {
		GenericServer.sendNotification("aventus/server/file-change", uri);
	}
}