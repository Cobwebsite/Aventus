import { sync as exist } from 'command-exists';
import { GenericServer } from '../../GenericServer';
import { execAsync } from '../../tools';

export class SharpUpdateTools {
	static cmd: string = "aventus.sharp.update_tools";

	public static async run() {

		if (!exist("dotnet")) {
			GenericServer.showErrorMessage("Dotnet isn't installed on your system");
			return;
		}
		const tools = {
			"csharp-converter": "dotnet tool update --global AventusSharp.Converter",
			"db-query": "dotnet tool update --global AventusSharp.DatabaseQuery",
		}
		const toolsDone: string[] = [];
		for (let tool in tools) {
			if (exist(tool)) {
				await GenericServer.showLoadingMessage("Updating " + tool, async () => {
					const result = await execAsync(tools[tool]);
					if (result.stderr) {
						GenericServer.showErrorMessage(result.stderr);
					}
					else {
						toolsDone.push(tool);
					}
				})
			}
		}

		if (toolsDone.length > 0) {
			GenericServer.showInformationMessage("Update done for : " + toolsDone.join(", "))
		}
	}
}