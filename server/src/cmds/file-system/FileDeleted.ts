import { FilesManager } from '../../files/FilesManager';

export class FileDeleted {
	static cmd: string = "aventus.filesystem.deleted";


	public static async run(uri: string) {
		if (uri) {
			const manager = FilesManager.getInstance();
			const prefix = uri.replace(/\/+$/, '') + '/';
			for (const fileUri of manager.getUris()) {
				if (fileUri === uri || fileUri.startsWith(prefix)) {
					await manager.onDeletedUri(fileUri);
				}
			}
		}
	}
}
