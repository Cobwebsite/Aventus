import { EOL } from 'os';
import { TextEdit } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusLanguageId } from '../../definition';
import { InternalAventusFile } from '../../files/AventusFile';
import { FilesManager } from '../../files/FilesManager';
import { AventusWebComponentLogicalFile } from '../../language-services/ts/component/File';
import { EditFile } from '../../notification/EditFile';
import { GenericServer } from '../../GenericServer';
import { reorderList } from '../../tools';
import { SelectItem } from '../../IConnection';

export class CreateProperty {
	static cmd: string = "aventus.wc.create.property";
	private static attrType: SelectItem[] = [
		{ label: "Number", detail: "number" },
		{ label: "String", detail: "string" },
		{ label: "Boolean", detail: "boolean" },
		{ label: "Date", detail: "Date" },
		{ label: "Datetime", detail: "Datetime" },
		{ label: "Custom", detail: "" },
	];

	

	public static async run(uri: string, position: number, prefillName: string) {
		if (!uri) {
			return;
		}
		if (!position) {
			return;
		}
		const name = await GenericServer.Input({
			title: "Provide a name for your Property",
			async validateInput(value) {
				if (!value.match(/^[_a-z0-9]+$/g)) {
					return 'A property must be with lowercase, number or _';
				}
				return null;
			},
			value: prefillName
		});
		if (!name) {
			return;
		}

		let typeResult = await GenericServer.Select(CreateProperty.attrType, {
			placeHolder: 'Choose a type?',
		})
		if (!typeResult) { return }
		reorderList(CreateProperty.attrType, typeResult);
		let type = typeResult.detail;

		const needCbResult = await GenericServer.Select([
			{ label: "Yes" }, { label: "No" }
		], {
			placeHolder: 'Do you need a callback function?',
		});

		if (!needCbResult) {
			return;
		}
		let needCb = needCbResult.label == "Yes";

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
				cb = '(target: ' + componentName + ') => {' + EOL + EOL + '}';
			}
			let newTxt = '@Property(' + cb + ')' + EOL + 'public ' + name + ':' + type + ';' + EOL;
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