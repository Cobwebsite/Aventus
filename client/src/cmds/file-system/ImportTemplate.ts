import { Singleton } from '../../Singleton';

export class TemplateImport {
	static cmd: string = "aventus.template.import";

	public static async middleware(args: any[]): Promise<any[] | null> {
		await Singleton.client.templateManager?.selectTemplateToImport();
		return null;
	}
}