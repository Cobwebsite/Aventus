import { Range } from 'vscode-languageclient';
import { Communication } from '../Communication';

export class GetKeyFromPosition extends Communication<{uri: string, range: Range}, string> {
	public channel(): string {
		return "aventus.i18n.getKeyFromPosition";
	}

	public static async execute(uri: string, range: Range): Promise<string | null> {
		const cmd = new GetKeyFromPosition();
		return await cmd.send({uri, range})
	}
}