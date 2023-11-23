import { FilesManager } from '../../files/FilesManager';

export class FileDeleted {
	static cmd: string = "aventus.filesystem.deleted";


	public static async run(uri: string) {
		if (uri) {
			FilesManager.getInstance().onDeletedUri(uri);
		}
	}
}