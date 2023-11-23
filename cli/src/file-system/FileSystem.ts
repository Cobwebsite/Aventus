import { FSWatcher, watch } from 'chokidar';
import { pathToUri } from '@server/tools'
import { FileCreated } from '@server/cmds/file-system/FileCreated';
import { FileUpdated } from '@server/cmds/file-system/FileUpdated';
import { FileDeleted } from '@server/cmds/file-system/FileDeleted';


export class FilesWatcher {

	private watcher: FSWatcher;
	private stack: { created: string[], updated: string[], deleted: string[] } = { created: [], deleted: [], updated: [] };
	private mutex: Mutex = new Mutex();
	private timeout: NodeJS.Timeout | undefined;

	public constructor(currentDir: string) {
		this.watcher = watch(currentDir + "/**/*.avt", {
			ignored: /(^|[\/\\])\../, // ignore dotfiles
			persistent: true
		});
		this.watcher
			.on('add', this.onCreate.bind(this))
			.on('change', this.onChange.bind(this))
			.on('unlink', this.onDelete.bind(this));

	}

	private async onCreate(path: string) {
		await this.mutex.waitOne();
		let uriTxt = path.toString();
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
		this.mutex.release();
		this.triggerTimer();

	}
	private async onChange(path: string) {
		await this.mutex.waitOne()
		let uriTxt = path.toString();
		// not in created
		if (!this.stack.created.includes(uriTxt) && !this.stack.updated.includes(uriTxt)) {
			this.stack.updated.push(uriTxt)
		}
		// remove delete
		let indexDelete = this.stack.deleted.indexOf(uriTxt);
		if (indexDelete != -1) {
			this.stack.deleted.splice(indexDelete, 1);
		}
		this.mutex.release();
		this.triggerTimer();
	}
	private async onDelete(path: string) {
		await this.mutex.waitOne();
		let uriTxt = path.toString();
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
		this.mutex.release();
		this.triggerTimer();
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
			FileDeleted.run(pathToUri(deleted));
		}
		for (let created of this.stack.created) {
			FileCreated.run(pathToUri(created));
		}
		for (let updated of this.stack.updated) {
			FileUpdated.run(pathToUri(updated));
		}
		this.stack = { created: [], deleted: [], updated: [] };
		this.mutex.release();
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