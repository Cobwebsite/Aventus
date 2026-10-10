import { FilesManager } from '../../files/FilesManager';

export class FileUpdated {
	static cmd: string = "aventus.filesystem.updated";

	public static async run(uri: string) {
		if (uri) {
			await FilesManager.getInstance().onUpdatedUri(uri);
		}
	}
}
