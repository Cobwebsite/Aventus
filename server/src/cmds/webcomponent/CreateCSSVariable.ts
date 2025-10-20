import { TextEdit } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusLanguageId } from '../../definition';
import { InternalAventusFile } from '../../files/AventusFile';
import { FilesManager } from '../../files/FilesManager';
import { EditFile } from '../../notification/EditFile';
import { GenericServer } from '../../GenericServer';

export class CreateCSSVariable {
	static cmd: string = "aventus.wc.create.cssvar";


	public static async run(uri: string, position: number) {
		if (!uri) {
			return;
		}
		if (typeof position !== 'number') {
			return;
		}

		let name = await GenericServer.Input({
			title: "Provide a name for your variable",
		})
		if (!name) { return; }

		let defaultValue = await GenericServer.Input({
			title: "Provide a default value for your variable",
		})

		let file = FilesManager.getInstance().getByUri(uri);
		if (file) {
			let fileName = file.name.match(/([A-Z][a-z]*)|([0-9]+[a-z]*)/g)?.join("-").toLowerCase() ?? file.name;
			let variableName = name.match(/([A-Z][a-z]*)|([0-9]+[a-z]*)/g)?.join("-").toLowerCase() ?? name;

			let defaultValueVar = defaultValue ? ", " + defaultValue : '';

			let oldEnd = file.documentUser.positionAt(file.contentUser.length);
			let newTxt = `--_${fileName}-${variableName}: var(--${fileName}-${variableName}${defaultValueVar});`
			let begin = file.contentUser.slice(0, position);
			let end = file.contentUser.slice(position + 1, file.contentUser.length);
			let txt = begin + newTxt + end;
			let newDocument = TextDocument.create(file.uri, AventusLanguageId.SCSS, file.versionUser + 1, txt);
			await (file as InternalAventusFile).triggerContentChange(newDocument);
			
			let textEdits = await (file as InternalAventusFile).getFormatting({
				insertSpaces: true,
				tabSize: 4
			});
			await (file as InternalAventusFile).applyTextEdits(textEdits);

			let result: TextEdit[] = [{
				newText: file.contentUser,
				range: {
					start: { character: 0, line: 0 },
					end: oldEnd
				}
			}];

			EditFile.send(uri, [result])

		}
	}
}