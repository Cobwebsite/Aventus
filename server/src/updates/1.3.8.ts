import { readdirSync, rmSync, statSync } from 'fs';
import { GenericServer } from '../GenericServer';
import { join } from 'path';

export function run() {
	const root = GenericServer.savePath;
	const files = readdirSync(root);
	for (let file of files) {
		try {
			if (statSync(join(root, file)).isDirectory()) {
				rmSync(join(root, file), { recursive: true, force: true })
			}
		} catch (e) {

		}
	}
}