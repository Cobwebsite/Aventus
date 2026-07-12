import { Singleton } from "../Singleton";
import { AventusMigration } from '../webview/migration';

export class Migration {
    public static cmd: string = "aventus.migration";

    public static async middleware(args: any[]): Promise<void> {
        if (Singleton.client.context) {
            new AventusMigration().getPreview(Singleton.client.context);
        }
    }
}