import { GenericServer } from '../../GenericServer';

export class ImportTemplate {
    static cmd: string = "aventus.template.import";



    public static async run() {
        await GenericServer.templateManager?.selectTemplateToImport();
    }
}