import { Singleton } from "../Singleton";

export class UnregisterStatic {
    public static cmd: string = "aventus/unregisterStatic";

    public static action(uri: string) {
        delete Singleton.allStatics[uri];
    }
}