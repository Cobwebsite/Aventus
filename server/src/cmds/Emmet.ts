import { ManifestPackage } from '../manifest/ManifestPackage';

export class Emmet {
	static cmd: string = "aventus.emmet";

	public static async run() {
		await ManifestPackage.write(true);
	}
}
