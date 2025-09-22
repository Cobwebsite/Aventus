
export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
        return {
            name: "Tailwind Template",
            description: "Create a tailwind component",
            version: "1.0.0"
        };
    }
    protected override async run(destination: string): Promise<void> {

        const name = await this.input({
            title: "Provide a name for your component",
            value: "",
            validations: [{
                message: "Provide a valide component name",
                regex: "[A-Z][A-Za-z0-9]+"
            }]
        });
        if(!name) return;

        this.registerVar("componentName", name);

        await this.writeFile((info) => {
            if(info.templatePath.endsWith(name + ".wcl.avt")) {
                info.openFileOnEnd();
            }
        });
    }

}