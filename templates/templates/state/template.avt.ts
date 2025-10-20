export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
        return {
            name: "State.Basic State",
            description: "Create a basic state",
            installationFolder: "Aventus/States"
        };
    }
    protected override async run(destination: string): Promise<void> {
        let name = await this.input({
            title: "Provide a name for your State",
        });
        if(!name) return;

        name = name.charAt(0).toUpperCase() + name.slice(1);
        this.registerVar("name", name);

        await this.writeFile();
        this.openFile(name + ".state.avt");
    }

}