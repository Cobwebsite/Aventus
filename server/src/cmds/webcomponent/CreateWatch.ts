import { TextEdit } from 'vscode-languageserver';
import { FilesManager } from '../../files/FilesManager';
import { AventusWebComponentLogicalFile } from '../../language-services/ts/component/File';
import { EOL } from 'os';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusLanguageId } from '../../definition';
import { InternalAventusFile } from '../../files/AventusFile';
import { EditFile } from '../../notification/EditFile';
import { GenericServer } from '../../GenericServer';

export class CreateWatch {
	static cmd: string = "aventus.wc.create.watch";

	public static async run(uri: string, position: number, prefillName: string) {
		if (!uri) {
			return;
		}
		if (!position) {
			return;
		}
		const name = await GenericServer.Input({
			title: "Provide a name for your Watch variable",
			value: prefillName
		});
		if (!name) {
			return;
		}

		const type = await GenericServer.Input({
			title: "Provide a type for your Watch",
		});
		if (!type) { return }
		
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
			let oldEnd = file.documentUser.positionAt(file.contentUser.length);
			let builds = FilesManager.getInstance().getBuild(file.documentUser);
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
			let newTxt = '@Watch(' + cb + ')' + EOL + 'public ' + name + '?:' + type + ';' + EOL;
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
					start: file.documentUser.positionAt(0),
					end: oldEnd
				}
			}];

			EditFile.send(uri, [result])

		}
	}

}