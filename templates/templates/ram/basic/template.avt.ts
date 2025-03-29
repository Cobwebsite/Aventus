export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
        return {
            name: "RAM.Basic",
            description: "Create a basic RAM"
        };
    }
    protected override async run(destination: string): Promise<void> {
        let name = await this.input({
            title: "Provide a data name for your RAM",
        });
        if(!name) return;

        this.registerVar("objectName", name);
        this.registerVar("className", name + "RAM");

        this.writeFile((config) => {
            config.openFileOnEnd();
        });
    }

}