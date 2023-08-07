import { TextEdit } from 'vscode-languageserver';
import { GenericServer } from '../GenericServer';


export class EditFile {

	public static send(uri: string, transformations: TextEdit[][]) {
		GenericServer.sendNotification("aventus/editFile", {
			uri,
			transformations
		})
	}
}