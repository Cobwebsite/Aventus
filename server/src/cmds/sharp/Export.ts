import { sync as exist } from 'command-exists';
import { GenericServer } from '../../GenericServer';
import { join } from 'path';
import { execSync } from 'child_process';
import { uriToPath } from '../../tools';
import { FilesManager } from '../../files/FilesManager';
import { SelectItem } from '../../IConnection';
import { AventusExtension } from '../../definition';
import { readFileSync } from 'fs';
import { AventusSharp } from '../../language-services/json/definition';
import { Compiling } from '../../notification/sharp/Compiling';
import { DebugFileAdd } from '../../notification/DebugFileAdd';
import { CSharpManager } from '../../language-services/json/CSharpManager';

export class SharpExport {
	static cmd: string = "aventus.sharp.export";
	private static isCompiling: boolean = false;

	public static async run(uri?: string) {
		if (this.isCompiling) {
			return;
		}

		if (!uri || !uri.endsWith(AventusExtension.CsharpConfig)) {
			let filesUri = Object.keys(CSharpManager.getInstance().files);
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
				GenericServer.showErrorMessage("No aventus.sharp.avt found");
				return;
			}
		}
		if (!exist("dotnet")) {
			GenericServer.showErrorMessage("Dotnet isn't installed on your system");
			return;
		}
		let csProjName = ''
		try {
			let ctx = readFileSync(uriToPath(uri), 'utf-8');
			let aventusSharp = JSON.parse(ctx) as AventusSharp;
			csProjName = aventusSharp.csProj;
		}
		catch (e) {
			console.log(e);
		}
		this.isCompiling = true;
		Compiling.send(csProjName, 'compiling');
		try {
			let execPath = join(GenericServer.extensionPath, "lib", "bin", "CSharpToTypescript", "CSharpToTypescript.dll")
			let csProj = uriToPath(uri);
			let result = execSync("dotnet " + execPath + " " + csProj).toString();
			if (result.indexOf("Error : ") == -1) {
				Compiling.send(csProjName, 'success');
			}
			else {
				console.clear();
				console.log(result);
				let uri = "csharp_errors";
				DebugFileAdd.send(uri, result);

				Compiling.send(csProjName, 'error', [{
					title: "C# error",
					file: uri
				}]);
			}
		} catch (e) {
			GenericServer.showErrorMessage(e + "");
		}
		this.isCompiling = false;
	}
}