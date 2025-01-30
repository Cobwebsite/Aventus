export type Version = `${number}-${number}-${number}`
export abstract class AventusTemplate {
	public abstract version(): Version
}

(global as any).AventusTemplate = AventusTemplate;
