export class ShowDependencies {
    static cmd: string = "aventus.dependencies.show";

    public static async middleware(args: any[]): Promise<any[]> {
        // if (Singleton.client.context) {
        //     new AventusDependenciesView().getView(Singleton.client.context, '');
        // }
        return args;
    }
}