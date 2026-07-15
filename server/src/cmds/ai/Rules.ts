import { join } from 'path';
import { GenericServer } from '../../GenericServer';
import { uriToPath } from '../../tools';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

export class Rules {
	static cmd: string = "aventus.ai.rules";

	public static async run() {

		let rulesSource = join(GenericServer.extensionPath, "lib", "aventusjs-rules.md")

		const workspace = GenericServer.getWorkspaceUri();
		const aventusDir = join(uriToPath(workspace), ".aventus");
		if (!existsSync(aventusDir)) {
			mkdirSync(aventusDir);
		}
		const rulesDest = join(aventusDir, "aventusjs-rules.md");

		copyFileSync(rulesSource, rulesDest)
	}
}