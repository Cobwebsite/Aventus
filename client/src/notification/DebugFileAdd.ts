import { Singleton } from '../Singleton';

export class DebugFileAdd {
	public static cmd: string = "aventus/addDebugFile";

	public static action(uri: string, content: string) {
		Singleton.client.debugFile.register(uri, content);
	}
}