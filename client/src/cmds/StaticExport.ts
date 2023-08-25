
export class StaticExport {
    static cmd: string = "aventus.static";

    public static async middleware(args: any[]): Promise<any[]> {
        return [];
    }
}