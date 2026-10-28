import { TextDocument } from 'vscode-languageserver-textdocument';
import { existsSync, readFileSync, readdirSync, rmdirSync, writeFileSync } from 'fs';
import { AventusExtension, AventusLanguageId } from '../definition';
import { FilesManager } from '../files/FilesManager';
import { CloseFile } from '../notification/CloseFile';
import { OpenFile } from '../notification/OpenFile';
import { unlinkSync, uriToPath } from '../tools';
import { GenericServer } from '../GenericServer';
import { ProjectManager } from '../project/ProjectManager';
import { InternalAventusFile } from '../files/AventusFile';

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
		const destinationUri = newUri + AventusExtension.Component;
		if (existsSync(uriToPath(destinationUri)) || FilesManager.getInstance().getByUri(destinationUri)) {
			GenericServer.showErrorMessage("Cannot merge component because the destination already exists: " + destinationUri);
			return;
		}

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

		const textEditsByUri = await ProjectManager.getInstance().onRename([{
			oldUri: fileUriNoExtension + AventusExtension.ComponentLogic,
			newUri: newUri + AventusExtension.Component,
		}]);
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
			destinationUri,
			AventusLanguageId.WebComponent,
			maxVersion + 1,
			mergeTxt
		);
		const references: { file: InternalAventusFile; content: string; disk: Buffer }[] = [];
		const sources = sourceDocs.map(doc => ({ path: doc.path, disk: readFileSync(doc.path) }));
		let destinationCreated = false;
		try {
			// Reserve the destination before changing any reference or source.
			writeFileSync(uriToPath(compDoc.uri), mergeTxt, { flag: 'wx' });
			destinationCreated = true;
			for (const editedUri in textEditsByUri) {
				const file = FilesManager.getInstance().getByUri(editedUri) as InternalAventusFile | undefined;
				if (!file) continue;
				references.push({ file, content: file.contentUser, disk: readFileSync(uriToPath(editedUri)) });
				await file.applyTextEdits(textEditsByUri[editedUri]);
				writeFileSync(uriToPath(editedUri), file.contentUser);
			}
			for (const source of sources) unlinkSync(source.path);
			rmdirSync(folderPath);
		} catch (error) {
			if (!destinationCreated && error && (error as NodeJS.ErrnoException).code === 'EEXIST') {
				GenericServer.showErrorMessage("Cannot merge component because the destination already exists: " + destinationUri);
				return;
			}
			for (const source of sources) {
				if (!existsSync(source.path)) writeFileSync(source.path, source.disk);
			}
			for (const { file, content, disk } of references.reverse()) {
				writeFileSync(file.path, disk);
				if (file.contentUser !== content) {
					await file.applyTextEdits([{
						range: { start: { line: 0, character: 0 }, end: file.documentUser.positionAt(file.contentUser.length) },
						newText: content,
					}]);
				}
			}
			if (destinationCreated) unlinkSync(uriToPath(compDoc.uri));
			throw error;
		}
		if (scssDoc) {
			FilesManager.getInstance().onClose(scssDoc.documentUser);
			CloseFile.send(scssDoc.uri);
		}
		if (jsDoc) {
			FilesManager.getInstance().onClose(jsDoc.documentUser);
			CloseFile.send(jsDoc.uri);
		}
		if (htmlDoc) {
			FilesManager.getInstance().onClose(htmlDoc.documentUser);
			CloseFile.send(htmlDoc.uri);
		}

		FilesManager.getInstance().registerFile(compDoc);
		OpenFile.send(compDoc.uri);
	}
}

function addTab(text) {
	return text.replace(/\r\n?/g, "\n").split("\n").join("\n\t");
}
