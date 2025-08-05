
export class PhpExport {
	static cmd: string = "aventus.php.export";

	public static async middleware(args: any[]): Promise<any[]> {
		let result: string[] = []
		if (args.length > 0) {
			result.push(args[0].toString());
		}
		return result;
	}
}