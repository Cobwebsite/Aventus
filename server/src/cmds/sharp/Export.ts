import { sync as exist } from 'command-exists';
import { GenericServer } from '../../GenericServer';
import { execAsync, uriToPath } from '../../tools';
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

		if (!exist("dotnet")) {
			GenericServer.showErrorMessage("Dotnet isn't installed on your system");
			return;
		}
		if (!exist("csharp-converter")) {
			try {
				if(await GenericServer.ask("csharp-converter is missing. Can I install it?")) {
					await execAsync("dotnet tool install --global AventusSharp.Converter");
				}

				if (!exist("csharp-converter")) {
					GenericServer.showErrorMessage("Can't find the converter. Run the command : dotnet tool install --global AventusSharp.Converter");
					return;
				}
			}
			catch (e) {
				GenericServer.showErrorMessage(e + "");
				return;
			}
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
		let csProjName = ''
		try {
			let ctx = readFileSync(uriToPath(uri), 'utf-8');
			let aventusSharp = JSON.parse(ctx) as AventusSharp;
			csProjName = aventusSharp.csProj;
		}
		catch (e) {
			GenericServer.error(e);
		}
		this.isCompiling = true;
		Compiling.send(csProjName, 'compiling');
		try {
			let csProj = uriToPath(uri);
			const { stdout } = await execAsync("csharp-converter " + csProj);
			let result = stdout.toString()
			if (result.indexOf("Error : ") == -1) {
				Compiling.send(csProjName, 'success');
			}
			else {
				console.clear();
				GenericServer.error(result);
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