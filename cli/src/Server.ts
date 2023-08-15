import { GenericServer } from '@server/GenericServer';
import { Create } from '@server/cmds/Create';
import { CliConnection, FakeConnection } from './Connection';
import { pathToUri } from '@server/tools';
import { FilesWatcher } from './file-system/FileSystem'
import { Interaction } from './Interaction';

export class Server {
	private static server: GenericServer | null = null;
	private static cliConnection: CliConnection | null = null;
	private static get connection(): FakeConnection | null {
		return this.cliConnection ? this.cliConnection._connection : null;
	}
	private static waitingStart: (() => void) | null = null;
	public static start() {
		return new Promise<void>((resolve) => {
			if (!this.server) {
				this.cliConnection = new CliConnection();
				new FilesWatcher(process.cwd())
				this.server = new GenericServer(this.cliConnection);
				this.server.start();
				this.waitingStart = () => {
					this.waitingStart = null;
					resolve();
				}
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
		await Interaction.log();
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
			if (result.length == 0) {
				result.push("No error");
			}
		}
		return result
	}


}