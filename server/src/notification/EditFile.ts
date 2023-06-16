import { ClientConnection } from '../Connection';
import { TextEdit } from 'vscode-languageserver';


export class EditFile {

	public static send(uri: string, transformations: TextEdit[][]) {
		ClientConnection.getInstance().sendNotification("aventus/editFile", {
			uri,
			transformations
		})
	}
}