import { GenericServer } from '../GenericServer';

export class DebugFileAdd {

	public static send(uri: string, content: string) {
		GenericServer.sendNotification("aventus/addDebugFile", uri, content);
	}
}