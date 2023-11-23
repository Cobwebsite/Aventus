import { ExecuteCommandParams } from 'vscode-languageserver';
import { sync as exist } from 'command-exists';
import { GenericServer } from '../../GenericServer';
import { join } from 'path';
import { execSync } from 'child_process';
import { uriToPath } from '../../tools';
import { Loading } from '../../notification/Loading';
import { FilesManager } from '../../files/FilesManager';
import { SelectItem } from '../../IConnection';

export class SharpExport {
	static cmd: string = "aventus.sharp.export";
	private static isCompiling: boolean = false;

	public static async run(uri?: string) {
		if (this.isCompiling) {
			return;
		}

		if (!uri) {
			let filesUri = FilesManager.getInstance().csharpFilesUri;
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
				return;
			}
		}
		if (!exist("dotnet")) {
			GenericServer.showErrorMessage("Dotnet isn't installed on your system");
			return;
		}
		this.isCompiling = true;
		let endFct = Loading.send("Compiling c#");
		try {
			let execPath = join(GenericServer.extensionPath, "lib", "bin", "CSharpToTypescript", "CSharpToTypescript.dll")
			let csProj = uriToPath(uri);
			let result = execSync("dotnet " + execPath + " " + csProj).toString();
			if (result.indexOf("Error : ") == -1) {
				endFct("Compilation success", 5000);
			}
			else {
				console.clear();
				console.log(result);
				endFct("Compilation error", 5000);
			}
		} catch (e) {
			GenericServer.showErrorMessage(e+"");
			endFct("", 0);
		}
		this.isCompiling = false;
	}
}