import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process';

const __dirname = import.meta.dirname;

const tsconfigPath = __dirname + '/../server/tsconfig.json';
const root = __dirname + '/..';

let tsconfig = readFileSync(tsconfigPath, 'utf8');
tsconfig = tsconfig.replace("\"composite\": true", "\"composite\": false");
writeFileSync(tsconfigPath, tsconfig);

execSync("npm run compile:server", {
	cwd: root
})

tsconfig = tsconfig.replace("\"composite\": false", "\"composite\": true");
tsconfig = tsconfig.replace("\"declaration\": false", "\"declaration\": true");
writeFileSync(tsconfigPath, tsconfig);

execSync("npm run _package:cli", {
	cwd: root
})

tsconfig = tsconfig.replace("\"composite\": true", "\"composite\": false");
tsconfig = tsconfig.replace("\"declaration\": true", "\"declaration\": false");
writeFileSync(tsconfigPath, tsconfig);