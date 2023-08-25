
export class SplitComponent {
	static cmd: string = "aventus.component.split";

	public static async middleware(args: any[]): Promise<any[]> {
		return [args[0].toString()];
	}
}