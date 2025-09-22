import { AventusExtension } from '../../../definition';
import { AventusFile, InternalAventusFile } from '../../../files/AventusFile';
import { FilesManager } from '../../../files/FilesManager';
import { AventusTemplateFile } from './File';

export class TemplateFileManager {

	private static instance: TemplateFileManager;
	public static getInstance(): TemplateFileManager {
		if (!this.instance) {
			this.instance = new TemplateFileManager();
		}
		return this.instance;
	}

	private constructor() {
		FilesManager.getInstance().onNewFile(this.onNewFile.bind(this));
	}
	private async onNewFile(file: AventusFile) {
		if (file.documentUser.uri.endsWith(AventusExtension.Template)) {
			let templateFile = new AventusTemplateFile(file);
			if(file instanceof InternalAventusFile) {
				await file.validate();
			}
		}
	}
}