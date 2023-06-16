import { Singleton } from "../Singleton";
import { AventusPeview } from "../webview/preview";

export class OpenPreview {
    public static cmd: string = "aventus/openpreview";

    public static action(uris: {
        script: string,
        style: string,
        html: string,
    }) {
        if (Singleton.client.context) {
            new AventusPeview().getPreview(Singleton.client.context, uris.script);
        }
    }
}