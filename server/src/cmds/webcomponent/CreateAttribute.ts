import { EOL } from 'os';
import { TextEdit } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusLanguageId } from '../../definition';
import { InternalAventusFile } from '../../files/AventusFile';
import { FilesManager } from '../../files/FilesManager';
import { EditFile } from '../../notification/EditFile';
import { GenericServer } from '../../GenericServer';
import { SelectItem } from '../../IConnection';
import { reorderList } from '../../tools';

export class CreateAttribute {
	static cmd: string = "aventus.wc.create.attribute";
	private static attrType: SelectItem[] = [
		{ label: "Number", detail: "number" },
		{ label: "String", detail: "string" },
		{ label: "Boolean", detail: "boolean" },
		{ label: "Date", detail: "Date" },
		{ label: "Datetime", detail: "Datetime" },
		{ label: "Custom", detail: "" },
	];


	public static async run(uri: string, position: number) {
		if (!uri) {
			return;
		}
		if (!position) {
			return;
		}

		let name = await GenericServer.Input({
			title: "Provide a name for your Attribute",
			validations: [{
				message:'A property must be with lowercase, number or _',
				regex:'^[_a-z0-9]+$'
			}]
		})
		if (!name) { return; }

		let typeResult = await GenericServer.Select(CreateAttribute.attrType, {
			placeHolder: 'Choose a type?',
		})
		if (!typeResult) { return }
		reorderList(CreateAttribute.attrType, typeResult);
		let type = typeResult.detail;

		let file = FilesManager.getInstance().getByUri(uri);
		if (file) {
			let nullable = "?";
			if (type == "boolean" || type == "number") {
				nullable = "!"
			}
			let oldEnd = file.documentUser.positionAt(file.contentUser.length);
			let newTxt = '@Attribute()' + EOL + 'public ' + name + nullable + ':' + type + ';' + EOL;
			let begin = file.contentUser.slice(0, position);
			let end = file.contentUser.slice(position + 1, file.contentUser.length);
			let txt = begin + newTxt + end;
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
					start: { character: 0, line: 0 },
					end: oldEnd
				}
			}];

			EditFile.send(uri, [result])

		}
	}
}