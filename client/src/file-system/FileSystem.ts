import { FileRenameEvent, FileSystemWatcher, Uri, workspace } from 'vscode';
import { FileCreated } from '../cmds/file-system/FileCreated';
import { FileDeleted } from '../cmds/file-system/FileDeleted';
import { FileUpdated } from '../cmds/file-system/FileUpdated';
import { Rename } from '../cmds/Rename';
import { AutoLoader } from '../manifest/AutoLoader';

export class FileSystem {
	private fs: FileSystemWatcher;
	private stack: { created: string[], updated: string[], deleted: string[] } = { created: [], deleted: [], updated: [] };
	private timeout: NodeJS.Timeout | undefined;
	private mutex: Mutex = new Mutex();

	public get htmlManifest() { return AutoLoader.htmlManifest }
	public get emmetManifest() { return AutoLoader.emmetManifest }

	private aventusExtension = ".avt";
	public constructor() {
		this.onCreate = this.onCreate.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.fs = workspace.createFileSystemWatcher(`**/{*${this.aventusExtension},${this.htmlManifest},${this.emmetManifest}}`)
		this.fs.onDidCreate(this.onCreate)
		this.fs.onDidChange(this.onChange)
		this.fs.onDidDelete(this.onDelete)
		workspace.onWillRenameFiles(this.onRename, this);
	}

	private async onCreate(uri: Uri) {
		await this.mutex.waitOne();
		const uriTxt = uri.toString();
		if (uriTxt.endsWith(this.aventusExtension)) {
			this.onCreateAvt(uri);
		}
		else if (uriTxt.endsWith(this.htmlManifest) || uriTxt.endsWith(this.emmetManifest)) {
			await AutoLoader.getInstance().register(uri)
		}
		this.mutex.release();
		if (uriTxt.endsWith(this.aventusExtension)) {
			this.triggerTimer();
		}
	}
	private onCreateAvt(uri: Uri) {
		let uriTxt = this.uriToString(uri);
		if (!this.stack.created.includes(uriTxt)) {
			this.stack.created.push(uriTxt);
		}
		// remove update
		let indexUpdated = this.stack.updated.indexOf(uriTxt);
		if (indexUpdated != -1) {
			this.stack.updated.splice(indexUpdated, 1);
		}
		// remove delete
		let indexDelete = this.stack.deleted.indexOf(uriTxt);
		if (indexDelete != -1) {
			this.stack.deleted.splice(indexDelete, 1);
		}
	}
	private async onChange(uri: Uri) {
		await this.mutex.waitOne()
		const uriTxt = uri.toString();
		if (uriTxt.endsWith(this.aventusExtension)) {
			this.onChangeAvt(uri);
		}
		this.mutex.release();
		if (uriTxt.endsWith(this.aventusExtension)) {
			this.triggerTimer()
		}
	}
	private onChangeAvt(uri: Uri) {
		let uriTxt = this.uriToString(uri);
		// not in created
		if (!this.stack.created.includes(uriTxt) && !this.stack.updated.includes(uriTxt)) {
			this.stack.updated.push(uriTxt)
		}
		// remove delete
		let indexDelete = this.stack.deleted.indexOf(uriTxt);
		if (indexDelete != -1) {
			this.stack.deleted.splice(indexDelete, 1);
		}
	}
	private async onDelete(uri: Uri) {
		await this.mutex.waitOne();

		const uriTxt = uri.toString();
		if (uriTxt.endsWith(this.aventusExtension)) {
			this.onDeleteAvt(uri);
		}
		this.mutex.release();
		if (uriTxt.endsWith(this.aventusExtension)) {
			this.triggerTimer()
		}
	}
	private onDeleteAvt(uri: Uri) {
		let uriTxt = this.uriToString(uri);
		if (!this.stack.deleted.includes(uriTxt)) {
			this.stack.deleted.push(uriTxt);
		}
		// remove update
		let indexUpdated = this.stack.updated.indexOf(uriTxt);
		if (indexUpdated != -1) {
			this.stack.updated.splice(indexUpdated, 1);
		}
		// remove create
		let indexCreated = this.stack.created.indexOf(uriTxt);
		if (indexCreated != -1) {
			this.stack.created.splice(indexCreated, 1);
		}
	}

	public uriToString(uri: Uri) {
		let uriTxt = uri.toString();
		uriTxt = uriTxt.replace("file:///", "").replace(/\/\//g, "/");
		return "file:///" + uriTxt;
	}
	private triggerTimer() {
		clearTimeout(this.timeout);
		setTimeout(() => {
			this.sendStack();
		}, 500);
	}

	private async sendStack() {
		await this.mutex.waitOne();

		for (let deleted of this.stack.deleted) {
			FileDeleted.execute(deleted);
		}
		for (let created of this.stack.created) {
			FileCreated.execute(created);
		}
		for (let updated of this.stack.updated) {
			FileUpdated.execute(updated);
		}
		this.stack = { created: [], deleted: [], updated: [] };
		this.mutex.release();
	}

	private onRename(e: FileRenameEvent) {
		Rename.execute(e.files);
	}

	public stop() {
		if (this.fs) {
			this.fs.dispose();
		}
		this.mutex.dispose();
	}


}

class Mutex {
	private waitingList: (() => void)[] = [];
	private isLocked: boolean = false;
	public waitOne() {
		return new Promise<void>((resolve) => {
			if (this.isLocked) {
				this.waitingList.push(() => {
					resolve();
				})
			}
			else {
				this.isLocked = true;
				resolve();
			}
		})

	}
	public release() {
		let nextFct = this.waitingList.shift();
		if (nextFct) {
			nextFct();
		}
		else {
			this.isLocked = false;
		}
	}
	public dispose() {
		this.waitingList = [];
		this.isLocked = false;
	}
}