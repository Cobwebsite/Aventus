export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
        return {
            name: "State.Basic State Manager",
            description: "Create a basic state manager"
        };
    }
    protected override async run(destination: string): Promise<void> {
        let name = await this.input({
            title: "Provide a name for your State Manager",
        });
        if(!name) return;

        name = name.charAt(0).toUpperCase() + name.slice(1);
        this.registerVar("name", name);
        if (name.endsWith("Manager")) {
			name = name.replace("Manager", "");
		}
        this.registerVar("className", name);

        this.writeFile((config) => {
            config.openFileOnEnd();
        });
    }

}