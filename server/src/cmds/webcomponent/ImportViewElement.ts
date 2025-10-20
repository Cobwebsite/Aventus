import { TextEdit } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusLanguageId } from '../../definition';
import { InternalAventusFile } from '../../files/AventusFile';
import { FilesManager } from '../../files/FilesManager';
import { AventusWebComponentLogicalFile } from '../../language-services/ts/component/File';
import { EditFile } from '../../notification/EditFile';

export class ImportViewElement {
	static cmd: string = "aventus.wc.import.viewElement";

	

	public static async run(uri: string, position: number) {
		let file = FilesManager.getInstance().getByUri(uri);
		if (file) {
			let oldEnd = file.documentUser.positionAt(file.contentUser.length);
			let builds = FilesManager.getInstance().getBuild(file.documentUser);
			if (builds && builds.length > 0) {
				let fileTs = builds[0].tsFiles[uri]
				if (fileTs instanceof AventusWebComponentLogicalFile) {
					let info = fileTs.getMissingVariablesInfo();
					if (position == -1) {
						position = info.start;
					}
					if (position == -1) {
						return;
					}
					if (info.text != "") {
						let begin = file.contentUser.slice(0, position);
						let end = file.contentUser.slice(position + 1, file.contentUser.length);
						let txt = begin + info.text + end;
						let newDocument = TextDocument.create(file.uri, AventusLanguageId.TypeScript, file.versionUser + 1, txt);
						await (file as InternalAventusFile).triggerContentChange(newDocument);
						let textEdits = await (file as InternalAventusFile).getFormatting({
							insertSpaces: true,
							tabSize: 4
						});
						await (file as InternalAventusFile).applyTextEdits(textEdits);

						let result: TextEdit[] = [{
							newText: file.contentUser,
							range: {
								start: file.documentUser.positionAt(0),
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