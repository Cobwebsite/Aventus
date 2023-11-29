import { GenericServer } from '../GenericServer';

export class DebugFileRemove {

	public static send(uri: string) {
		GenericServer.sendNotification("aventus/removeDebugFile", uri);
	}
}