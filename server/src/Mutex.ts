
export class MutexDisposedError extends Error {
	constructor() {
		super('Mutex disposed while waiting for the lock');
		this.name = 'MutexDisposedError';
	}
}

export class Mutex {
	private waitingList: { resolve: () => void; reject: (error: Error) => void }[] = [];
	private isLocked: boolean = false;
	public waitOne() {
		return new Promise<void>((resolve, reject) => {
			if (this.isLocked) {
				this.waitingList.push({ resolve, reject });
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
			nextFct.resolve();
		}
		else {
			this.isLocked = false;
		}
	}
	public dispose() {
		const waitingList = this.waitingList;
		this.waitingList = [];
		this.isLocked = false;
		for (const waiter of waitingList) {
			waiter.reject(new MutexDisposedError());
		}
	}
}

export class ActionGuard {
    /**
     * Map to store actions that are currently running.
     * @type {Map<any[], Promise<any>>}
     * @private
     */
    private runningAction: Map<any[], Promise<any>> = new Map();

    /**
     * Executes an action uniquely based on the specified keys.
     * @template T
     * @param {any[]} keys The keys associated with the action.
     * @param {() => Promise<T>} action The action to execute.
     * @returns {Promise<T>} A promise that resolves with the result of the action.
     * @example
     * // Example usage:
     * // Create an instance of ActionGuard
     * const actionGuard = new Aventus.ActionGuard();
     * 
     * // Define keys for the action
     * const keys = ["key1", "key2"];
     * 
     * // Define the action to execute
     * const action = async () => {
     *     // Simulate an asynchronous operation
     *     await new Promise(resolve => setTimeout(resolve, 1000));
     *     return "Action executed";
     * };
     * 
     * // Execute the action using ActionGuard
     * await actionGuard.run(keys, action)
     *
     */
    public run<T extends any>(keys: any[], action: () => Promise<T>): Promise<T>;
    public run<T extends any>(action: () => Promise<T>): Promise<T>;
    public run<T extends any>(keys: any[] | (() => Promise<T>), action?: () => Promise<T>): Promise<T> {
        if (typeof keys === 'function') {
            action = keys;
            keys = [];
        }
        if (!action) {
            return Promise.reject(new Error('No action inside the ActionGuard.run'));
        }

        for (const [runningKeys, promise] of this.runningAction) {
            if (runningKeys.length === keys.length && runningKeys.every((key, index) => key === keys[index])) {
                return promise as Promise<T>;
            }
        }

        const currentKeys = keys;
        const promise = Promise.resolve().then(action).finally(() => {
            this.runningAction.delete(currentKeys);
        });
        this.runningAction.set(currentKeys, promise);
        return promise;
    }
}
