import { Communication } from '../Communication';

export class GetLocales extends Communication<{uri: string}, string[]> {
	public channel(): string {
		return "aventus.i18n.getLocales";
	}

	public static async execute(uri: string): Promise<string[] | null> {
		const cmd = new GetLocales();
		return await cmd.send({uri})
	}
}