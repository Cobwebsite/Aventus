import { unlinkSync, writeFileSync } from 'fs';
import { ExecuteCommandParams } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusExtension, AventusLanguageId } from '../definition';
import { FilesManager } from '../files/FilesManager';
import { AventusWebComponentSingleFile } from '../language-services/ts/component/File';
import { CloseFile } from '../notification/CloseFile';
import { OpenFile } from '../notification/OpenFile';
import { getPathFromCommandArguments, uriToPath } from '../tools';

export class SplitComponent {
	static cmd: string = "aventus.component.split";
	constructor(params: ExecuteCommandParams) {
		if (params.arguments && params.arguments[0]) {
			let fileUri: string = getPathFromCommandArguments(params);
			let wcDoc = FilesManager.getInstance().getByUri(fileUri);
			if (wcDoc) {
				let resultTemp = AventusWebComponentSingleFile.getRegion(wcDoc);
				let scssUri = fileUri.replace(AventusExtension.Component, AventusExtension.ComponentStyle);
				let scssDoc: TextDocument = TextDocument.create(scssUri, AventusLanguageId.SCSS, wcDoc.version + 1, resultTemp.cssText);
				writeFileSync(uriToPath(scssUri), scssDoc.getText());


				let htmlUri = fileUri.replace(AventusExtension.Component, AventusExtension.ComponentView);
				let htmlDoc: TextDocument = TextDocument.create(htmlUri, AventusLanguageId.HTML, wcDoc.version + 1, resultTemp.htmlText);
				writeFileSync(uriToPath(htmlUri), htmlDoc.getText());

				let tsUri = fileUri.replace(AventusExtension.Component, AventusExtension.ComponentLogic);
				let tsDoc: TextDocument = TextDocument.create(tsUri, AventusLanguageId.TypeScript, wcDoc.version + 1, resultTemp.scriptText);
				writeFileSync(uriToPath(tsUri), tsDoc.getText());

				unlinkSync(wcDoc.path);
				FilesManager.getInstance().onClose(wcDoc.document);
				CloseFile.send(wcDoc.uri);



				FilesManager.getInstance().registerFile(scssDoc);
				FilesManager.getInstance().registerFile(htmlDoc);
				FilesManager.getInstance().registerFile(tsDoc);
				OpenFile.send(tsDoc.uri);
			}
		}
	}
}
