
type ParamsType = { uri: string, transformations: { range: Range, newText: string }[][] }
export class EditFile {
    public static cmd: string = "aventus/editFile";

    public static async action(params: ParamsType) {
        try {
           
        } catch (e) {
            console.log(e);
        }
    }
}