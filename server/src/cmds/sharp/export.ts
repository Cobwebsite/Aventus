import { ExecuteCommandParams } from 'vscode-languageserver';
import { sync as exist } from 'command-exists';
import { GenericServer } from '../../GenericServer';
import { join } from 'path';
import { execSync } from 'child_process';
import { uriToPath } from '../../tools';
import { Loading } from '../../notification/Loading';

export class SharpExport {
	static cmd: string = "aventus.sharp.export";
	private static isCompiling: boolean = false;

	public static async run(uri?: string) {
		if (!uri || this.isCompiling) {
			return;
		}
		if (!exist("dotnet")) {
			GenericServer.showErrorMessage("Dotnet isn't installed on your system");
			return;
		}

		this.isCompiling = true;
		let endFct = Loading.send("Compiling c#");
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
		this.isCompiling = false;
	}
}