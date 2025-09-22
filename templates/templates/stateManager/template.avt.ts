export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
        return {
            name: "State.Basic State Manager",
            description: "Create a basic state manager",
            installationFolder: "Aventus/StateManagers"
        };
    }
    protected override async run(destination: string): Promise<void> {
        let name = await this.input({
            title: "Provide a name for your State Manager",
        });
        if(!name) return;

        name = name.charAt(0).toUpperCase() + name.slice(1);
        this.registerVar("name", name);
        let className = name;
        if (className.endsWith("Manager")) {
			className = className.replace("Manager", "");
		}
        this.registerVar("className", className);

        await this.writeFile();
        this.openFile(name + ".state.avt");
    }

}