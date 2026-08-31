import { spawn } from 'child_process';
import { realpathSync } from 'fs';
import { resolve } from 'path';
import { Action, ActionOption, ArgOption } from './Action';
import { version as currentVersion } from '../../package.json';

type UpdateOptions = {}

const packageName = '@aventusjs/cli';

export class Update extends Action<UpdateOptions> {
	public get name(): string {
		return "update";
	}
	public get description(): string {
		return "Update the cli";
	}

	protected registerArgs(_addArg: (arg: ArgOption) => void) { }

	protected registerOptions(_addOption: (option: ActionOption<UpdateOptions>) => void) { }

	public async run(_args: string[], _options: UpdateOptions): Promise<void> {
		const latestVersion = (await this.runNpm(['view', packageName, 'version'])).trim();
		if (!latestVersion) {
			throw new Error(`npm did not return a version for ${packageName}.`);
		}

		if (latestVersion === currentVersion) {
			console.log(`${packageName} is already up to date (${currentVersion}).`);
			return;
		}

		const globalRoot = (await this.runNpm(['root', '--global'])).trim();
		const packageRoot = realpathSync(resolve(__dirname, '..', '..'));
		let globalPackageRoot: string | undefined;

		try {
			globalPackageRoot = realpathSync(resolve(globalRoot, packageName));
		}
		catch {
			// The package is not installed globally.
		}

		const isGlobal = globalPackageRoot === packageRoot;
		const installArgs = isGlobal
			? ['install', '--global', `${packageName}@${latestVersion}`]
			: ['install', '--save-dev', `${packageName}@${latestVersion}`];

		await this.runNpm(installArgs, true);
		console.log(`${packageName} was updated to ${latestVersion}.`);
	}

	private runNpm(args: string[], inheritOutput = false): Promise<string> {
		return new Promise((resolvePromise, reject) => {
			const child = spawn('npm', args, {
				cwd: process.cwd(),
				shell: process.platform === 'win32',
				stdio: inheritOutput ? 'inherit' : ['ignore', 'pipe', 'pipe'],
			});
			let stdout = '';
			let stderr = '';

			if (!inheritOutput) {
				child.stdout?.on('data', chunk => stdout += chunk.toString());
				child.stderr?.on('data', chunk => stderr += chunk.toString());
			}

			child.on('error', reject);
			child.on('close', code => {
				if (code === 0) {
					resolvePromise(stdout);
					return;
				}

				const details = stderr.trim();
				reject(new Error(`npm ${args.join(' ')} failed with exit code ${code}${details ? `: ${details}` : '.'}`));
			});
		});
	}
}
