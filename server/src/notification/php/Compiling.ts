import { GenericServer } from '../../GenericServer';
import { BuildErrors } from '../../project/Build';

export class Compiling {
	public static send(csproj: string, part: 'compiling' | 'success' | 'error', errors?: BuildErrors) {
		GenericServer.sendNotification("aventus/php/compiling", csproj, part, errors);
	}
}