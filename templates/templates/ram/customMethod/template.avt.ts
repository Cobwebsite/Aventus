export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
        return {
            name: "RAM.Custom methods",
            description: "Create a RAM where you can add custom methods inside your model"
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