
export class MergeComponent {
	static cmd: string = "aventus.component.merge";

	public static async middleware(args: any[]): Promise<any[]> {
		return [args[0].toString()];
	}
}