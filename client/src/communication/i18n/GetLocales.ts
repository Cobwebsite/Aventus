import { Communication } from '../Communication';

export class GetLocales extends Communication<{ uri: string }, { locales: string[], fallback: string }> {
	public channel(): string {
		return "aventus.i18n.getLocales";
	}

	public static async execute(uri: string): Promise<{ locales: string[], fallback: string } | null> {
		const cmd = new GetLocales();
		return await cmd.send({ uri })
	}
}