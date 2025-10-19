import { sep } from 'path';


export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
        return {
            name: "Empty",
            description: "Empty Aventus Project",
            version: "1.0.0",
            isProject: true,
            installationFolder: "Aventus/Empty"
        };
    }
    protected override async run(destination: string): Promise<void> {

        const name = await this.input({
            title: "Provide a name for your project",
            value: destination.split(sep).pop(),
            validations: [{
                message: "Provide a valid name",
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