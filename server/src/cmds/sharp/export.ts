import { ExecuteCommandParams } from 'vscode-languageserver';

export class SharpExport {
	static cmd: string = "aventus.sharp.export";
	constructor(params: ExecuteCommandParams) {
		if (params.arguments && params.arguments.length > 1) {
			let uri = params.arguments[0];
			
		}
	}
}