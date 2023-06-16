import { Singleton } from "../Singleton";

export class RegisterData {
    public static cmd: string = "aventus/registerData";

    public static action(datas: [string[], string]) {
        Singleton.dataClasses[datas[1]] = datas[0];
    }
}