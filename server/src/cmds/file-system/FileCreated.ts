import { FilesManager } from '../../files/FilesManager';

export class FileCreated {
	static cmd: string = "aventus.filesystem.created";

	public static async run(uri: string) {
		if (uri) {
			await FilesManager.getInstance().onCreatedUri(uri);
		}
	}
}
