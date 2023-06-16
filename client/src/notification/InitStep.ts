import { Singleton } from "../Singleton";

export class InitStep {
    public static cmd: string = "aventus/initStep";

    private static doneTxt = "Aventus : Done";
    public static action(txt: string) {
        if (Singleton.client.components) {
            let components = Singleton.client.components;
            Singleton.client.components.lastCompiledInfo.text = txt;
            if (txt == InitStep.doneTxt) {
                Singleton.client.startFileSystem();
                setTimeout(() => {
                    if (components.lastCompiledInfo.text == InitStep.doneTxt) {
                        components.lastCompiledInfo.text = '';
                    }
                }, 5000)
            }
        }
    }
}