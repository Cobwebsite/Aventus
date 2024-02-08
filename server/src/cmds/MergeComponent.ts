import { TextDocument } from 'vscode-languageserver-textdocument';
import { rmdirSync, unlinkSync, writeFileSync } from 'fs';
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

		let splittedUri = fileUriNoExtension.split('/');
		let filename = splittedUri.pop();
		let foldername = splittedUri.pop();
		let newUri = splittedUri.join('/') + '/' + filename;

		let maxVersion = 0;
		let jsDoc = FilesManager.getInstance().getByUri(fileUriNoExtension + AventusExtension.ComponentLogic);
		if (jsDoc && jsDoc.versionUser > maxVersion) { maxVersion = jsDoc.versionUser; }
		let jsTxt = jsDoc ? jsDoc.contentUser : "";

		let scssDoc = FilesManager.getInstance().getByUri(fileUriNoExtension + AventusExtension.ComponentStyle);
		if (scssDoc && scssDoc.versionUser > maxVersion) { maxVersion = scssDoc.versionUser; }
		let scssTxt = scssDoc ? scssDoc.contentUser : "";


		let htmlDoc = FilesManager.getInstance().getByUri(fileUriNoExtension + AventusExtension.ComponentView);
		if (htmlDoc && htmlDoc.versionUser > maxVersion) { maxVersion = htmlDoc.versionUser; }
		let htmlTxt = htmlDoc ? htmlDoc.contentUser : "";


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
			newUri + AventusExtension.Component,
			AventusLanguageId.WebComponent,
			maxVersion + 1,
			mergeTxt
		);
		writeFileSync(uriToPath(compDoc.uri), mergeTxt);
		if (scssDoc) {
			unlinkSync(scssDoc.path);
			FilesManager.getInstance().onClose(scssDoc.documentUser);
			CloseFile.send(scssDoc.uri);
		}
		if (jsDoc) {
			unlinkSync(jsDoc.path);
			FilesManager.getInstance().onClose(jsDoc.documentUser);
			CloseFile.send(jsDoc.uri);
		}
		if (htmlDoc) {
			unlinkSync(htmlDoc.path);
			FilesManager.getInstance().onClose(htmlDoc.documentUser);
			CloseFile.send(htmlDoc.uri);
		}

		rmdirSync(uriToPath(splittedUri.join('/') + '/' + foldername));

		FilesManager.getInstance().registerFile(compDoc);
		OpenFile.send(compDoc.uri);
	}
}

function addTab(text) {
	return text.split("\n").join("\n\t");
}