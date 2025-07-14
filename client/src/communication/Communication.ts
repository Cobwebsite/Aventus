import { Client } from '../Client';
import { Singleton } from '../Singleton';

export abstract class Communication<T, U> {
	public abstract channel(): string;

	private client: Client;

	public constructor() {
		this.client = Singleton.client;
	}

	public async send(body: T) {
		return await this.client.sendRequest<U>(this.channel(), body);
	}
}