
export class Create {
    static cmd: string = "aventus.create";

    public static async middleware(args: any[]): Promise<any[]> {
        let result: string[] = [];
        if (args[0]) {
            result.push(args[0].toString());
        }
        
        return result;
    }
}