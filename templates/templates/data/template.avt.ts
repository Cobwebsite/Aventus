export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
        return {
            name: "Data.Basic",
            description: "Create a basic data"
        };
    }
    protected override async run(destination: string): Promise<void> {
        let name = await this.input({
            title: "Provide a name for your Data",
        });
        if(!name) return;

        this.registerVar("dataName", name);
        name = name.replace(/_|-([a-z])/g, (match, p1) => p1.toUpperCase());
        name = name.charAt(0).toUpperCase() + name.slice(1);
        this.registerVar("className", name);

        this.writeFile((config) => {
			config.openFileOnEnd();
		});
    }

}