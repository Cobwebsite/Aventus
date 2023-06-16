import { Singleton } from "../Singleton";

export class RegisterStatic {
    public static cmd: string = "aventus/registerStatic";

    public static action(statics: [string[], string]) {
        Singleton.allStatics[statics[1]] = statics[0];
    }
}