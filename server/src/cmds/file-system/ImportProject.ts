import { GenericServer } from '../../GenericServer';

export class ImportProject {
    static cmd: string = "aventus.template.import_project";



    public static async run() {
        await GenericServer.templateManager?.selectProjectToImport();
    }
}