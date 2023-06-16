import { ExecuteCommandParams, TextEdit } from 'vscode-languageserver';
import { FilesManager } from '../../files/FilesManager';
import { AventusWebComponentLogicalFile } from '../../language-services/ts/component/File';
import { EOL } from 'os';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusLanguageId } from '../../definition';
import { InternalAventusFile } from '../../files/AventusFile';
import { EditFile } from '../../notification/EditFile';

export class CreateWatch {
	static cmd: string = "aventus.wc.create.watch";

	constructor(params: ExecuteCommandParams) {
		if (params.arguments && params.arguments.length == 5) {
			let uri = params.arguments[0];
			let name: string = params.arguments[1];
			let type: string = params.arguments[2];
			let cb: boolean = params.arguments[3];
			let position: number = params.arguments[4];
			this.run(uri, name, type, cb, position);
		}
	}

	private async run(uri: string, name: string, type: string, needCb: boolean, position: number) {
		let file = FilesManager.getInstance().getByUri(uri);
		if (file) {
			let oldEnd = file.document.positionAt(file.content.length);
			let builds = FilesManager.getInstance().getBuild(file.document);
			let componentName = "";
			if (builds.length > 0) {
				let fileTs = builds[0].tsFiles[uri]
				if (fileTs instanceof AventusWebComponentLogicalFile) {
					componentName = fileTs.getComponentName();
				}
			}
			if (componentName == "") {
				return;
			}
			let cb = '';
			if (needCb) {
				cb = '(target: ' + componentName + ', action: Aventus.WatchAction, path: string, value: any) => {' + EOL + EOL + '}';
			}
			let newTxt = '@Watch(' + cb + ')' + EOL + 'public ' + name + ':' + type + ';' + EOL;
			let begin = file.content.slice(0, position);
			let end = file.content.slice(position + 1, file.content.length);
			let txt = begin + newTxt + end;
			let newDocument = TextDocument.create(file.uri, AventusLanguageId.TypeScript, file.version + 1, txt);
			await (file as InternalAventusFile).triggerContentChange(newDocument);
			let textEdits = await (file as InternalAventusFile).getFormatting({
				insertSpaces: true,
				tabSize: 4
			});
			await (file as InternalAventusFile).applyTextEdits(textEdits);

			let result: TextEdit[] = [{
				newText: file.content,
				range: {
					start: file.document.positionAt(0),
					end: oldEnd
				}
			}];

			EditFile.send(uri, [result])

		}
	}
}