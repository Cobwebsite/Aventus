export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
		return {
			name: "Library.Default Class Library",
			description: "Create a basic library class"
		}
	}
    protected override async run(destination: string): Promise<void> {
		let name = await this.input({
            title: "Provide a name for your Library",
        });
        if(!name) return;

		this.registerVar("libName", name);
        name = name.replace(/_|-([a-z])/g, (match, p1) => p1.toUpperCase());
        name = name.charAt(0).toUpperCase() + name.slice(1);
        this.registerVar("className", name);
        
		this.writeFile((config) => {
			config.openFileOnEnd();
		});
    }

}