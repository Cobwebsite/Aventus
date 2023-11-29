import { Singleton } from '../Singleton';

export class DebugFileAdd {
	public static cmd: string = "aventus/removeDebugFile";

	public static action(uri: string) {
		Singleton.client.debugFile.remove(uri);
	}
}