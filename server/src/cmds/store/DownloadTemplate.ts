import { GenericServer } from '../../GenericServer';

export class StoreDownloadTemplate {
	static cmd: string = "aventus.store.download_template";

	public static async run(url: string) {
		if (!url) return;

		await GenericServer.templateManager?.downloadTemplateFromStore(url);
	}
}