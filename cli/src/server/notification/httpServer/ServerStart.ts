
export class ServerStart {
    public static cmd: string = "aventus/server/start";

    public static callbacks: ((info: string) => any)[] = []

    public static action(info: string) {
        const cbs = [...this.callbacks];

        for (let cb of cbs) {
            cb(info)
        }
    }
}