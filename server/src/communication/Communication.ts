

export abstract class Communication<T, U> {
	public abstract channel(): string;

	public abstract run(body: T): Promise<U>
}