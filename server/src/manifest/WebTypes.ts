import { join } from 'path';
import { AventusTsFile } from '../language-services/ts/File';
import { writeFile } from '../tools';
import { Manifest, ManifestInfo } from './Manifest';
import { AventusWebComponentLogicalFile } from '../language-services/ts/component/File';
import { TypeInfo } from '../language-services/ts/parser/TypeInfo';
import { GenericHtmlContributionOrProperty, GenericHtmlContributions, HtmlAttribute, HtmlElement, JSONSchemaForWebTypes, JsProperty } from './WebTypesSchema';


export class WebTypes {

	private manifest: Manifest;
	private _package: JSONSchemaForWebTypes;
	public constructor(manifest: Manifest) {
		this.manifest = manifest;
		this._package = {
			$schema: "https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json",
			name: "",
			version: "2.20.0",
			"description-markup": "markdown",
			contributions: {
				html: {
					elements: [
						{
							"name": "sl-alert",
							"description": "Alerts are used to display important messages inline or as toast notifications.\n---\n\n\n### **Events:**\n - **sl-show** - Emitted when the alert opens.\n- **sl-after-show** - Emitted after the alert opens and all animations are complete.\n- **sl-hide** - Emitted when the alert closes.\n- **sl-after-hide** - Emitted after the alert closes and all animations are complete.\n\n### **Methods:**\n - **show()** - Shows the alert.\n- **hide()** - Hides the alert\n- **toast()** - Displays the alert as a toast notification. This will move the alert out of its position in the DOM and, when\ndismissed, it will be removed from the DOM completely. By storing a reference to the alert, you can reuse it by\ncalling this method again. The returned promise will resolve after the alert is hidden.\n\n### **Slots:**\n - _default_ - The alert's main content.\n- **icon** - An icon to show in the alert. Works best with `<sl-icon>`.\n\n### **CSS Parts:**\n - **base** - The component's base wrapper.\n- **icon** - The container that wraps the optional icon.\n- **message** - The container that wraps the alert's main content.\n- **close-button** - The close button, an `<sl-icon-button>`.\n- **close-button__base** - The close button's exported `base` part.",
							"doc-url": "",
							"attributes": [
								{
									"name": "open",
									"description": "Indicates whether or not the alert is open. You can toggle this attribute to show and hide the alert, or you can\nuse the `show()` and `hide()` methods and this attribute will reflect the alert's open state.",
									"value": { "type": "boolean", "default": "false" },
								},
								{
									"name": "closable",
									"description": "Enables a close button that allows the user to dismiss the alert.",
									"value": { "type": "boolean", "default": "false" }
								},
								{
									"name": "variant",
									"description": "The alert's theme variant.",
									"value": {
										"type": "'primary' | 'success' | 'neutral' | 'warning' | 'danger'",
										"default": "'primary'"
									}
								},
								{
									"name": "duration",
									"description": "The length of time, in milliseconds, the alert will show before closing itself. If the user interacts with\nthe alert before it closes (e.g. moves the mouse over it), the timer will restart. Defaults to `Infinity`, meaning\nthe alert will not close on its own.",
									"value": { "type": "string", "default": "Infinity" }
								},
								{
									"name": "countdown",
									"description": "Enables a countdown that indicates the remaining time the alert will be displayed.\nTypically used to indicate the remaining time before a whole app refresh.",
									"value": { "type": "'rtl' | 'ltr' | undefined" }
								}
							],
							"slots": [
								{ "name": "", "description": "The alert's main content." },
								{
									"name": "icon",
									"description": "An icon to show in the alert. Works best with `<sl-icon>`."
								}
							],
							"events": [
								{
									"name": "sl-show",
									"description": "Emitted when the alert opens."
								},
								{
									"name": "sl-after-show",
									"description": "Emitted after the alert opens and all animations are complete."
								},
								{
									"name": "sl-hide",
									"description": "Emitted when the alert closes."
								},
								{
									"name": "sl-after-hide",
									"description": "Emitted after the alert closes and all animations are complete."
								}
							],
							"js": {
								"properties": [
									{ "name": "base", "type": "HTMLElement" },
									{ "name": "countdownElement", "type": "HTMLElement" },
									{
										"name": "open",
										"description": "Indicates whether or not the alert is open. You can toggle this attribute to show and hide the alert, or you can\nuse the `show()` and `hide()` methods and this attribute will reflect the alert's open state.",
										"type": "boolean"
									},
									{
										"name": "closable",
										"description": "Enables a close button that allows the user to dismiss the alert.",
										"type": "boolean"
									},
									{
										"name": "variant",
										"description": "The alert's theme variant.",
										"type": "'primary' | 'success' | 'neutral' | 'warning' | 'danger'"
									},
									{
										"name": "duration",
										"description": "The length of time, in milliseconds, the alert will show before closing itself. If the user interacts with\nthe alert before it closes (e.g. moves the mouse over it), the timer will restart. Defaults to `Infinity`, meaning\nthe alert will not close on its own."
									},
									{
										"name": "countdown",
										"description": "Enables a countdown that indicates the remaining time the alert will be displayed.\nTypically used to indicate the remaining time before a whole app refresh.",
										"type": "'rtl' | 'ltr' | undefined"
									}
								],
								"events": [
									{
										"name": "sl-show",
										"description": "Emitted when the alert opens."
									},
									{
										"name": "sl-after-show",
										"description": "Emitted after the alert opens and all animations are complete."
									},
									{
										"name": "sl-hide",
										"description": "Emitted when the alert closes."
									},
									{
										"name": "sl-after-hide",
										"description": "Emitted after the alert closes and all animations are complete."
									}
								]
							}
						}
					]
				},
			},
		}
	}

	public write(dir: string) {
		writeFile(join(dir, "web-types.json"), JSON.stringify(this._package, null, 2), "build", this.manifest.build.buildConfig.name);
	}

	public register(file: AventusWebComponentLogicalFile, info: ManifestInfo) {
		if (!this._package.contributions?.html?.elements) return;

		const compilationResult = file.compileResult.find(p => p.classScript.split('.').pop() == file.componentClassName)!;
		if (!compilationResult) return;
		const element: HtmlElement = {
			name: compilationResult.tagName,
			description: this.manifest.generateDescription(info),
			"doc-url": "",
		}
		if (info.class.isAbstract) {
			element.abstract = true;
		}

		// attributes
		const attributes: HtmlAttribute[] = [];
		for (let attribute of info.attributes) {
			const _attribute: HtmlAttribute = {
				name: attribute.name,
			}
			const type = this.getTypeTxt(attribute.type);
			const doc = attribute.documentation?.definitions.join("\n");
			let description: string = "";
			if (type) {
				description = type
			}
			if (doc) {
				if (description) {
					description += "\n\n";
				}
				description += doc;
			}
			if (description) _attribute.description = description;

			const values: { type: string, default?: string }[] = [];
			if (attribute.type.kind == "literal") {
				let value = attribute.type.value;
				if (value.startsWith("'") || value.startsWith('"')) {
					value = value.substring(1);
				}
				if (value.endsWith("'") || value.endsWith('"')) {
					value = value.substring(0, value.length - 1);
				}
				values.push({ type: value });
			}
			else if (attribute.type.kind == "union") {
				for (let nested of attribute.type.nested) {
					let value = nested.value;
					if (value.startsWith("'") || value.startsWith('"')) {
						value = value.substring(1);
					}
					if (value.endsWith("'") || value.endsWith('"')) {
						value = value.substring(0, value.length - 1);
					}
					values.push({ type: value });
				}
			}

			if (values.length > 0) {
				_attribute.values = values;
			}

		}
		if (attributes.length > 0) {
			element.attributes = attributes;
		}
		// slots
		const slots: GenericHtmlContributionOrProperty[] = [];
		for (let name in info.slots) {
			if (!info.slots[name].local) continue;
			const slot: GenericHtmlContributionOrProperty = { name };
			if (info.slots[name].doc) {
				slot.description = info.slots[name].doc
			}
			slots.push(slot);
		}
		if (slots.length > 0) {
			element.slots = slots;
		}

		// properties
		const props: JsProperty[] = []
		for (let prop of info.props) {
			const temp: JsProperty = {};
			temp.name = prop.name
			if (prop.isAbstract) {
				temp.abstract = prop.isAbstract;
			}
			if (prop.documentation) temp.description = prop.documentation.definitions.join("\n");
			temp.type = this.getTypeTxt(prop.type)

			props.push(temp);
		}
		if (props.length > 0) {
			if (!element.js) element.js = {};
			element.js.properties = props;
		}

		// events		
		

		this._package.contributions.html.elements.push(element);
	}


	private getTypeTxt(typeInfo: TypeInfo) {
		return this.manifest.getTypeTxt(typeInfo);
	}
}