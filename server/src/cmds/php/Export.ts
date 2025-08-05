import { sync as exist } from 'command-exists';
import { GenericServer } from '../../GenericServer';
import { join } from 'path';
import { execSync } from 'child_process';
import { uriToPath } from '../../tools';
import { SelectItem } from '../../IConnection';
import { AventusExtension } from '../../definition';
import { readFileSync } from 'fs';
import { AventusSharp } from '../../language-services/json/definition';
import { Compiling } from '../../notification/sharp/Compiling';
import { DebugFileAdd } from '../../notification/DebugFileAdd';
import { PhpManager } from '../../language-services/json/PhpManager';

export class PhpExport {
	static cmd: string = "aventus.php.export";
	private static isCompiling: boolean = false;

	public static async run(uri?: string) {
		if (this.isCompiling) {
			return;
		}

		if (!uri || !uri.endsWith(AventusExtension.PhpConfig)) {
			let filesUri = Object.keys(PhpManager.getInstance().files);
			if (filesUri.length == 1) {
				uri = filesUri[0];
			}
			else if (filesUri.length > 1) {
				let items: SelectItem[] = [];
				for (let fileUri of filesUri) {
					items.push({
						label: fileUri
					})
				}
				let result = await GenericServer.Select(items, {
					placeHolder: 'Project to compile'
				})
				if (result) {
					uri = result.label;
				}
				else {
					return;
				}
			}
			else {
				GenericServer.showErrorMessage("No aventus.php.avt found");
				return;
			}
		}
		if (!exist("php")) {
			GenericServer.showErrorMessage("Php isn't installed on your system");
			return;
		}
		let phpProjName = ''
		try {
			let ctx = readFileSync(uriToPath(uri), 'utf-8');
			let aventusSharp = JSON.parse(ctx) as AventusSharp;
			phpProjName = aventusSharp.csProj;
		}
		catch (e) {
			console.log(e);
		}
		this.isCompiling = true;
		Compiling.send(phpProjName, 'compiling');
		try {
			let execPath = join(GenericServer.extensionPath, "lib", "bin", "PhpToTypescript", "PhpToTypescript")
			let phpProj = uriToPath(uri);
			let result = execSync("php " + execPath + " " + phpProj).toString();
			if (result.indexOf("Error : ") == -1) {
				Compiling.send(phpProjName, 'success');
			}
			else {
				console.clear();
				console.log(result);
				let uri = "php_errors";
				DebugFileAdd.send(uri, result);

				Compiling.send(phpProjName, 'error', [{
					title: "PHP error",
					file: uri
				}]);
			}
		} catch (e) {
			GenericServer.showErrorMessage(e + "");
		}
		this.isCompiling = false;
	}
}