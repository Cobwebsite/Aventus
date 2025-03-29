export class Template extends AventusTemplate {
    protected override meta(): TemplateInfo {
        return {
            name: "Component.Basic",
            description: "Create a basic webcomponent",
            version: "1.0.0"
        };
    }

    protected override async run(destination: string): Promise<void> {
		let name = await this.input({
            title: "Provide a name for your Component",
        });
        if(!name) return;

        const resultFormat = await this.select([
            { label: "Single", detail: "Single file" },
            { label: "Multiple", detail: "Splitted file" }
        ], { placeHolder: 'How should I setup your component?' });
        if(!resultFormat) return;

        const isSingle = resultFormat.label == "Single";

        this.registerVar("componentName", name);
        name = name.replace(/_|-([a-z])/g, (match, p1) => p1.toUpperCase());
        let className = name.charAt(0).toUpperCase() + name.slice(1);
        this.registerVar("className", className);

        await this.writeFile((config) => {
            if(isSingle) {
                return config.relativePath.endsWith(".wc.avt");
            }
            if(config.relativePath.endsWith(".wcl.avt")) {
                config.openFileOnEnd();
            }
            return !config.relativePath.endsWith(".wc.avt");
        });
    }

}