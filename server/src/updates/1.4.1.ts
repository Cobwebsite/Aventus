import { existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { GenericServer } from '../GenericServer';
import { join } from 'path';

export function run() {
	const root = join(GenericServer.savePath, "packages");
	if (!existsSync(root)) {
		return
	}
	checkFolder(root);
}

function checkFolder(folder: string) {
	const files = readdirSync(folder);
	for (let file of files) {
		try {
			const tot = join(folder, file);
			if (lstatSync(tot).isDirectory()) {
				checkFolder(tot);
			}
			else if (file.endsWith(".avt")) {
				let txt = readFileSync(tot, "utf8");
				txt = txt.replace(/dependances/g, "dependencies");
				writeFileSync(tot, txt);
			}
		} catch (e) {
			console.error(e);
		}
	}
}