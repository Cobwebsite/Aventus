import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusExtension, AventusLanguageId } from '../definition';
import { FilesManager } from '../files/FilesManager';
import { AventusWebComponentSingleFile } from '../language-services/ts/component/SingleFile';
import { CloseFile } from '../notification/CloseFile';
import { OpenFile } from '../notification/OpenFile';
import { uriToPath } from '../tools';

export class SplitComponent {
	static cmd: string = "aventus.component.split";

	public static async run(uri: string) {
		if (!uri) {
			return;
		}
		let filename = uri.split('/').pop()?.replace(AventusExtension.Component, "");

		let wcDoc = FilesManager.getInstance().getByUri(uri);
		if (wcDoc) {

			let newFolderPath = uriToPath(uri.replace(AventusExtension.Component, ""));
			if (!existsSync(newFolderPath))
				mkdirSync(newFolderPath);
			const newUri = uri.replace(AventusExtension.Component, "") + '/' + filename;

			let resultTemp = AventusWebComponentSingleFile.getRegion(wcDoc);
			let scssUri = newUri + AventusExtension.ComponentStyle;
			let scssDoc: TextDocument = TextDocument.create(scssUri, AventusLanguageId.SCSS, wcDoc.versionUser + 1, resultTemp.cssText ?? '');
			writeFileSync(uriToPath(scssUri), scssDoc.getText());


			let htmlUri = newUri + AventusExtension.ComponentView;
			let htmlDoc: TextDocument = TextDocument.create(htmlUri, AventusLanguageId.HTML, wcDoc.versionUser + 1, resultTemp.htmlText ?? '');
			writeFileSync(uriToPath(htmlUri), htmlDoc.getText());

			let tsUri = newUri + AventusExtension.ComponentLogic;
			let tsDoc: TextDocument = TextDocument.create(tsUri, AventusLanguageId.TypeScript, wcDoc.versionUser + 1, resultTemp.scriptText ?? '');
			writeFileSync(uriToPath(tsUri), tsDoc.getText());

			unlinkSync(wcDoc.path);
			FilesManager.getInstance().onClose(wcDoc.documentUser);
			CloseFile.send(wcDoc.uri);



			FilesManager.getInstance().registerFile(scssDoc);
			FilesManager.getInstance().registerFile(htmlDoc);
			FilesManager.getInstance().registerFile(tsDoc);
			OpenFile.send(tsDoc.uri);
		}
	}
}
