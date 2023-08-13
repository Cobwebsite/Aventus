import { GenericServer } from '@server/GenericServer';
import { CliConnection, FakeConnection } from './Connection';

export class Server {
	private static server: GenericServer | null = null;
	private static cliConnection: CliConnection | null = null;
	private static get connection(): FakeConnection | null {
		return this.cliConnection ? this.cliConnection._connection : null;
	}
	public static start() {
		this.cliConnection = new CliConnection();
		this.server = new GenericServer(new CliConnection());
		this.server.start();
	}

	public static stop() {
		if (this.connection) {
			this.connection.stop();
		}
	}

	
}