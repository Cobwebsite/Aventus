declare type Version = `${number}.${number}.${number}`;
declare abstract class AventusTemplate {
	public abstract version(): Version
}