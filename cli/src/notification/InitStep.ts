import { Server } from '../Server';

export class InitStep {
    public static cmd: string = "aventus/initStep";

    private static doneTxt = "Aventus : Done";
    public static action(txt: string) {
        txt = txt.replace("$(loading~spin)", "◌");
        console.log(txt);
        if (txt == this.doneTxt) {
            Server.started();
        }
    }
}