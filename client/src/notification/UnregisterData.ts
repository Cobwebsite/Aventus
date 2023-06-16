import { Singleton } from "../Singleton";

export class UnregisterData {
    public static cmd: string = "aventus/unregisterData";

    public static action(uri: string) {
        delete Singleton.dataClasses[uri];
    }
}