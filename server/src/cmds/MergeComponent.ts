import { TextDocument } from 'vscode-languageserver-textdocument';
import { existsSync, readdirSync, rmdirSync, writeFileSync } from 'fs';
import { AventusExtension, AventusLanguageId } from '../definition';
import { FilesManager } from '../files/FilesManager';
import { CloseFile } from '../notification/CloseFile';
import { OpenFile } from '../notification/OpenFile';
import { unlinkSync, uriToPath } from '../tools';
import { GenericServer } from '../GenericServer';

export class MergeComponent {
	static cmd: string = "aventus.component.merge";


	public static async run(uri: string) {
		if (!uri) {
			return;
		}
		const extensions = [AventusExtension.ComponentLogic, AventusExtension.ComponentView, AventusExtension.ComponentStyle];
		const extension = extensions.find(value => uri.endsWith(value));
		if (!extension) return;
		let fileUriNoExtension = uri.slice(0, -extension.length);

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
		
		const sourceDocs = [jsDoc, scssDoc, htmlDoc].filter(doc => doc !== undefined);
		if (!sourceDocs.some(doc => doc.uri === uri)) return;
		const folderPath = uriToPath(splittedUri.join('/') + '/' + foldername);
		const sourceNames = new Set(sourceDocs.map(doc => doc.path.split(/[\\/]/).pop()));
		if (!existsSync(folderPath)) return;
		const unexpectedFiles = readdirSync(folderPath).filter(name => !sourceNames.has(name));
		if (unexpectedFiles.length > 0) {
			GenericServer.showErrorMessage("Cannot merge component because the folder contains other files: " + unexpectedFiles.join(", "));
			return;
		}
		if (sourceDocs.some(doc => !existsSync(doc.path))) return;

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

		rmdirSync(folderPath);

		FilesManager.getInstance().registerFile(compDoc);
		OpenFile.send(compDoc.uri);
	}
}

function addTab(text) {
	return text.replace(/\r\n?/g, "\n").split("\n").join("\n\t");
}
