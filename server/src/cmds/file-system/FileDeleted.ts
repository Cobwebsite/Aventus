import { FilesManager } from '../../files/FilesManager';

export class FileDeleted {
	static cmd: string = "aventus.filesystem.deleted";


	public static async run(uri: string) {
		if (uri) {
			await FilesManager.getInstance().onDeletedUri(uri);
		}
	}
}
