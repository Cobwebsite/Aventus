import { defineConfig, } from 'rolldown';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const isProduction = process.env.NODE_ENV === 'production';
/**
 * @param {import('rolldown').Config} extConfig
 * @returns {import('rolldown').Config}
 */
export function withDefaults(extConfig) {

	if (!Array.isArray(extConfig)) {
		extConfig = [extConfig];
	}

	const projectDir = extConfig[0].context || process.cwd();
	const pkgPath = resolve(projectDir, 'package.json');

	let version = '0.0.1'; // Version de secours
	try {
		const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
		version = pkg.version || version;
	} catch (e) {
		console.warn(`[Rolldown Config] Impossible de charger le package.json à l'adresse : ${pkgPath}`);
	}

	const configs = [];
	for (let config of extConfig) {
		configs.push({
			platform: 'node',

			resolve: {
				extensions: ['.ts', '.js', '.json', '.cjs'],
				mainFields: ['module', 'main'],
			},

			external: [
				'vscode',
				'bufferutil',
				'utf-8-validate',
				'emitter',

				"@inquirer/core",
				"archiver",
				"chokidar",
				"commander",
				"connect",
				"esbuild",
				"inquirer-file-tree-selection-prompt",
				"open",
				"postcss",
				"sass",
				"send",
				"serve-index",
				"sudo-prompt",
				"terser",
				"typescript",
				"uglify-js",
				"unzipper",
				"vscode",
				"vscode-css-languageservice",
				"vscode-html-languageservice",
				"vscode-json-languageservice",
				"vscode-languageclient",
				"vscode-languageserver",
				"vscode-languageserver-textdocument",
				"ws",
				'@aws-sdk/client-s3',
			],

			transform: {
				define: {
					'__APP_VERSION__': `"${version}"`,
					'__APP_DEBUG__': isProduction ? `false` : `true`
				},
			},
			...config,

			output: {
				format: 'cjs',
				codeSplitting: false,
				sourcemap: !isProduction,
				minify: isProduction,
				...config.output
			}
		})
	}
	return defineConfig(configs);
}