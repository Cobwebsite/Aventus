import { TextDocument } from 'vscode-languageserver-textdocument';
import { unlinkSync, writeFileSync } from 'fs';
import { AventusExtension, AventusLanguageId } from '../definition';
import { FilesManager } from '../files/FilesManager';
import { CloseFile } from '../notification/CloseFile';
import { OpenFile } from '../notification/OpenFile';
import { uriToPath } from '../tools';

export class MergeComponent {
	static cmd: string = "aventus.component.merge";
	

	public static async run(uri: string) {
		if (!uri) {
			return;
		}
		let regex = new RegExp("(" + AventusExtension.ComponentLogic + ")|(" + AventusExtension.ComponentView + ")|(" + AventusExtension.ComponentView + ")$");
		let fileUriNoExtension = uri.replace(regex, '');

		let maxVersion = 0;
		let jsDoc = FilesManager.getInstance().getByUri(fileUriNoExtension + AventusExtension.ComponentLogic);
		if (jsDoc && jsDoc.version > maxVersion) { maxVersion = jsDoc.version; }
		let jsTxt = jsDoc ? jsDoc.content : "";

		let scssDoc = FilesManager.getInstance().getByUri(fileUriNoExtension + AventusExtension.ComponentStyle);
		if (scssDoc && scssDoc.version > maxVersion) { maxVersion = scssDoc.version; }
		let scssTxt = scssDoc ? scssDoc.content : "";


		let htmlDoc = FilesManager.getInstance().getByUri(fileUriNoExtension + AventusExtension.ComponentView);
		if (htmlDoc && htmlDoc.version > maxVersion) { maxVersion = htmlDoc.version; }
		let htmlTxt = htmlDoc ? htmlDoc.content : "";


		let mergeTxt =
			`
<script>
	${addTab(jsTxt)}
</script>

<template>
	${addTab(htmlTxt)}
</template>

<style>
	${addTab(scssTxt)}
</style>
`;
		let compDoc = TextDocument.create(
			fileUriNoExtension + AventusExtension.Component,
			AventusLanguageId.WebComponent,
			maxVersion + 1,
			mergeTxt
		);
		writeFileSync(uriToPath(compDoc.uri), mergeTxt);
		if (scssDoc) {
			unlinkSync(scssDoc.path);
			FilesManager.getInstance().onClose(scssDoc.document);
			CloseFile.send(scssDoc.uri);
		}
		if (jsDoc) {
			unlinkSync(jsDoc.path);
			FilesManager.getInstance().onClose(jsDoc.document);
			CloseFile.send(jsDoc.uri);
		}
		if (htmlDoc) {
			unlinkSync(htmlDoc.path);
			FilesManager.getInstance().onClose(htmlDoc.document);
			CloseFile.send(htmlDoc.uri);
		}

		FilesManager.getInstance().registerFile(compDoc);
		OpenFile.send(compDoc.uri);
	}
}

function addTab(text) {
	return text.split("\n").join("\n\t");
}
