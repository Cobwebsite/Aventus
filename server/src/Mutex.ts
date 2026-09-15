
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

export class ActionGuard {
    /**
     * Map to store actions that are currently running.
     * @type {Map<any[], ((res: any) => void)[]>}
     * @private
     */
    private runningAction: Map<any[], ((res: any) => void)[]> = new Map();

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
        return new Promise<T>(async (resolve) => {
            if(typeof keys == 'function') {
                action = keys;
                keys = [];
            }
            if(!action) {
                throw "No action inside the Mutex.run"
            }
            // Retrieve actions associated with the keys
            let actions: ((res: any) => void)[] | undefined = undefined;
            let runningKeys = Array.from(this.runningAction.keys());
            for(let runningKey of runningKeys) {
                if(runningKey.length == keys.length) {
                    let found = true;
                    for(let i = 0; i < keys.length; i++) {
                        if(runningKey[i] != keys[i]) {
                            found = false;
                            break;
                        }
                    }
                    if(found) {
                        actions = this.runningAction.get(runningKey);
                        break;
                    }
                }
            }

            if(actions) {
                // If actions already exist, add the promise resolution to the actions list
                actions.push((res: T) => {
                    resolve(res);
                });
            }
            else {
                // If no action exists for the specified keys, initialize a new actions list
                this.runningAction.set(keys, []);
                // Execute the specified action
                let res = await action();
                // Retrieve actions associated with the keys again
                let actions = this.runningAction.get(keys);
                if(actions) {
                    // Execute all registered actions with the result of the action
                    for(let action of actions) {
                        action(res);
                    }
                }
                // Delete actions once they've all been executed
                this.runningAction.delete(keys);
                // Resolve the promise with the final result of the action
                resolve(res);
            }
        });
    }
}