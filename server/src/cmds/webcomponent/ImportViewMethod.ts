import { ExecuteCommandParams, TextEdit } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusLanguageId } from '../../definition';
import { InternalAventusFile } from '../../files/AventusFile';
import { FilesManager } from '../../files/FilesManager';
import { AventusWebComponentLogicalFile } from '../../language-services/ts/component/File';
import { EditFile } from '../../notification/EditFile';

export class ImportViewMethod {
	static cmd: string = "aventus.wc.import.viewMethod";

	constructor(params: ExecuteCommandParams) {
		if (params.arguments && params.arguments.length > 0) {
			let uri: string = params.arguments[0];
			let position: number = params.arguments.length > 1 ? params.arguments[1] : -1;
			this.run(uri, position);
		}
	}

	private async run(uri: string, position: number) {
		let file = FilesManager.getInstance().getByUri(uri);
		if (file) {
			let oldEnd = file.document.positionAt(file.content.length);
			let builds = FilesManager.getInstance().getBuild(file.document);
			if (builds.length > 0) {
				let fileTs = builds[0].tsFiles[uri]
				if (fileTs instanceof AventusWebComponentLogicalFile) {
					let info = fileTs.getMissingMethodsInfo();
					if (position == -1) {
						position = info.start;
					}
					if (position == -1) {
						return;
					}
					if (info.text != "") {
						let begin = file.content.slice(0, position);
						let end = file.content.slice(position + 1, file.content.length);
						let txt = begin + info.text + end;
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
		}
	}
}