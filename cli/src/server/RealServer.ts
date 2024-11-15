import { GenericServer } from '@server/GenericServer';
import { Create } from '@server/cmds/Create';
import { CliConnection, FakeConnection } from './Connection';
import { pathToUri } from '@server/tools';
import { FilesWatcher } from '../file-system/FileSystem'
import type { Interaction } from '../interaction/Interaction';
import { ServerConfig } from './Server';

export class RealServer {
	private static _interaction: typeof Interaction;
	public static get interaction(): typeof Interaction {
		return this._interaction;
	}
	private static server: GenericServer | null = null;
	private static cliConnection: CliConnection | null = null;
	private static get connection(): FakeConnection | null {
		return this.cliConnection ? this.cliConnection._connection : null;
	}
	private static waitingStart: (() => void) | null = null;
	public static start(config: ServerConfig) {
		return new Promise<void>((resolve) => {
			try {
				if (!this.server) {
					this.cliConnection = new CliConnection(config);
					if (!config.onlyBuild)
						new FilesWatcher(process.cwd())
					this.server = new GenericServer(this.cliConnection);
					this.waitingStart = () => {
						this.waitingStart = null;
						resolve();
					}
					this.server.start();
				}
			} catch(e) {
				console.log(e);
			}
		})
	}
	public static started() {
		if (this.waitingStart) {
			this.waitingStart();
		}
	}

	public static async create() {
		await Create.run(pathToUri(process.cwd()));
	}

	public static stop() {
		if (this.connection) {
			this.connection.stop();
		}
	}

	public static async log() {
		await this.interaction.log();
	}

	public static subscribeErrors(cb: (errors: string[]) => void) {
		this.cliConnection?.subscribeErrors(cb);
	}
	public static unsubscribeErrors(cb: (errors: string[]) => void) {
		this.cliConnection?.unsubscribeErrors(cb);
	}

	public static getErrors() {
		let result: string[] = [];

		if (this.cliConnection) {
			for (let uri in this.cliConnection.errorsByFile) {
				for (let error of this.cliConnection.errorsByFile[uri]) {
					result.push(error);
				}
			}
		}
		return result
	}


}