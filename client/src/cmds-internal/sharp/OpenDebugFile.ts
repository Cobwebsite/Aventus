import { Compiling } from '../../notification/sharp/Compiling';

export class OpenDebugFileSharp {
	static cmd: string = "aventus.openfile.debugsharp";

	public static async middleware(args: any[]): Promise<void> {
		Compiling.openDebug();
	}
}