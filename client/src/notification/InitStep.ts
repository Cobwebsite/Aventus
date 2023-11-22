import { Singleton } from "../Singleton";
import { Compiled } from './Compiled';

export class InitStep {
    public static cmd: string = "aventus/initStep";

    private static doneTxt = "Aventus : Done";
    public static isDone = false;
    public static action(txt: string) {
        if (Singleton.client.components) {
            let components = Singleton.client.components;
            Singleton.client.components.lastCompiledInfo.text = txt;
            if (txt == InitStep.doneTxt) {
                this.isDone = true;
                Singleton.client.startFileSystem();
                setTimeout(() => {
                    Compiled.render();
                }, 5000)
            }
        }
    }
}