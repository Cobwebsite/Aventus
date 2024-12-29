
export class Mutex {
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