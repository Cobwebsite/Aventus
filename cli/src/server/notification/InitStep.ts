import { RealServer } from '../RealServer';

export class InitStep {
    public static cmd: string = "aventus/initStep";

    private static doneTxt = "Aventus : Done";
    public static action(txt: string) {
        txt = txt.replace("$(loading~spin)", "◌");
        if (txt == this.doneTxt) {
            RealServer.started();
        }
    }
}