import { Singleton } from "../Singleton";

export class CompiledPart {
    public static cmd: string = "aventus/compiled/part";

    public static action(info: string) {

        if (Singleton.client.components) {
            Singleton.client.components.setLastCompiledInfo({
                text: "$(loading~spin) " + info
            });
        }
    }
}