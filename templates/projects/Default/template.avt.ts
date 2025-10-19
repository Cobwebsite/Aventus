import { sep } from 'path';


export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
        return {
            name: "Default",
            description: "A basic template",
            version: "1.0.0",
            isProject: true,
            installationFolder: "Aventus/Default"
        };
    }
    protected override async run(destination: string): Promise<void> {

        let defaultValue = destination.split(sep).pop();
        if(defaultValue) {
            defaultValue = defaultValue.replace(/ /g, "_").replace(/-/g, "_").replace(/\$/g, "_").replace(/\./g, "_")
        }
        const name = await this.input({
            title: "Provide a name for your project",
            value: defaultValue,
            validations: [{
                message: "Provide a valid name. Must match : ^[a-zA-Z0-9_]+$",
                regex: "^[a-zA-Z0-9_]+$"
            }]
        });
        if(!name) return;

        this.registerVar("name", name);

        let prefix = await this.input({
            placeHolder: "Provide a component prefix : (default is av)",
            validations: [{
                message: "Provide a valid prefix",
                regex: "^(?:[a-z]{2,})?$"
            }]
        });
        if(prefix == null) return;
        if(!prefix) {
            prefix = "av";
        }

        this.registerVar("componentPrefix", prefix);


        await this.writeFile();
        this.openFile("aventus.conf.avt")
    }

}