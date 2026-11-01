import { Compiling } from '../../notification/php/Compiling';

export class OpenDebugFilePhp {
	static cmd: string = "aventus.openfile.debugphp";

	public static async middleware(args: any[]): Promise<void> {
		Compiling.openDebug();
	}
}
