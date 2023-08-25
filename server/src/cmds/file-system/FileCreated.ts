import { FilesManager } from '../../files/FilesManager';

export class FileCreated {
	static cmd: string = "aventus.filesystem.created";

	public static run(uri: string) {
		if (uri) {
			FilesManager.getInstance().onCreatedUri(uri);
		}
	}
}