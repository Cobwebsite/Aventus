import { sep } from 'path';


export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
        return {
            name: "Tailwind",
            description: "Aventus Project with Tailwind support",
            version: "1.0.0",
            isProject: true,
            installationFolder: "Aventus/Tailwind"
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

        const prefix = await this.input({
            title: "Provide a component prefix",
            value: "av",
            validations: [{
                message: "Provide a valid prefix",
                regex: "^[a-z]{2,}$"
            }]
        });
        if(!prefix) return;

        this.registerVar("componentPrefix", prefix);


        await this.writeFile();
        this.openFile("aventus.conf.avt")

        const uuid = await this.showProgress("Installing package");
        await this.exec("npm i");
        await this.hideProgress(uuid);
    }

}