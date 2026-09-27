import { transpile, ScriptTarget, createSourceFile, isVariableStatement } from "typescript";
import { AventusErrorCode } from "../../../../definition";
import { Build } from "../../../../project/Build";
import { createErrorTs } from "../../../../tools";
import { AventusTsLanguageService } from "../../LanguageService";
import { AventusWebComponentLogicalFile } from "../File";
import { CompileComponentResult } from "./def";
import { TagNameDecorator } from "../../parser/decorators/TagNameDecorator";
import { PropertyDecorator } from "../../parser/decorators/PropertyDecorator";
import { TypeInfo } from "../../parser/TypeInfo";
import { AliasInfo } from "../../parser/AliasInfo";
import { ParserTs } from "../../parser/ParserTs";
import { nativeComponentExpression } from "./nativeTemplate";

/** The static subset compiles to a self-contained custom element. */
export class AventusWebcomponentCompilerSimple {
    public storyArgTypes = {};
    public storyArgs = {};
    public constructor(private logicalFile: AventusWebComponentLogicalFile, private build: Build) { }
    public compile(): CompileComponentResult {
        const file = this.logicalFile;
        const result: CompileComponentResult = {
            diagnostics: this.build.tsLanguageService.doValidation(file.file),
            writeCompiled: false, missingViewElements: { position: -1, elements: {} },
            missingMethods: { position: -1, elements: [] }, componentName: "",
            htmlDoc: {}, scssDoc: {}, result: [], debug: "", needRebuild: false
        };
        const error = (message: string) => result.diagnostics.push(createErrorTs(file.file.documentInternal, message, AventusErrorCode.WrongTypeDefinition));
        const classes = Object.values(file.fileParsed?.classes ?? {}).filter(info => info.isNativeWebcomponent);
        if (classes.length !== 1) { error("Exactly one NativeWebComponent class is allowed per file"); return result; }
        const info = classes[0];
        for (const decorator of info.decorators) {
            if (!["TagName", "Debugger", "Required", "Storybook", "Internal", "InternalProtected", "Deprecated"].includes(decorator.name)) error(`@${decorator.name} is unsupported in native components`);
        }
        if (Object.values(file.fileParsed?.classes ?? {}).some(value => value !== info && !value.isInterface) ||
            Object.keys(file.fileParsed?.enums ?? {}).length) error("Put runtime helper classes and enums in a separate file; native output contains one component only");
        if (info.isAbstract) { error("A native component must be concrete"); return result; }
        const parser = file.HTMLFile?.fileParsed;
        const actions = parser?.getParsedInfo(info.name);
        if (actions && (actions.loops.length || actions.ifs.length || actions.injection.length || actions.bindings.length || actions.pressEvents.length || actions.contextEdits.length || Object.keys(actions.content).length)) {
            error("NativeWebComponent supports only static HTML, @element and DOM events; loops, conditions, injections, bindings and press events are unsupported");
        }
        const tag = info.decorators.map(TagNameDecorator.is).find(value => value?.tagName)?.tagName ??
            [this.build.getComponentPrefix(), info.name.replace(/([a-z0-9])([A-Z])/g, "$1-$2")].filter(Boolean).join("-").toLowerCase();
        if (!/^[a-z][a-z0-9._-]*-[a-z0-9._-]*$/.test(tag)) error("A native component tag must be lower case and contain a hyphen");
        result.htmlDoc[tag] = { class: info.fullName, name: tag, description: info.documentation?.fullDefinitions.join("\n") ?? "", attributes: {} };
        let members = "", defaults = "", callbacks = "";
        const observed: string[] = [];
        const resolveType = (type: TypeInfo, seen = new Set<string>()): string | null => {
            if (["string", "number", "boolean"].includes(type.kind)) return type.kind;
            if (type.kind === "literal") return /^['"]/.test(type.value) ? "string" : /^(true|false)$/.test(type.value) ? "boolean" : "number";
            if (type.kind === "union") {
                const kinds = type.nested.filter(t => t.kind !== "undefined" && t.kind !== "null").map(t => resolveType(t, seen));
                return kinds.length && kinds.every(kind => kind === kinds[0]) ? kinds[0] : null;
            }
            if (type.kind === "type" && !seen.has(type.value)) {
                const alias = ParserTs.getBaseInfo(type.value);
                if (alias instanceof AliasInfo) return resolveType(alias.type, new Set([...seen, type.value]));
            }
            return null;
        };
        for (const field of Object.values(info.properties)) {
            const decorator = field.decorators.find(d => d.name === "Attribute" || d.name === "Property");
            for (const d of field.decorators) if (!["Attribute", "Property", "ViewElement", "Deprecated", "Internal", "InternalProtected", "NoType", "StoryValue"].includes(d.name)) error(`@${d.name} is unsupported in native components`);
            if (!decorator) { if (!field.decorators.some(d => d.name === "ViewElement")) members += field.compiledContent + "\n"; continue; }
            const kind = resolveType(field.type);
            if (!kind || field.isGet || field.isSet || field.isStatic || field.name.toLowerCase() !== field.name) {
                error(`Native attribute/property ${field.name} must be a lower-case instance field of type string, number or boolean`); continue;
            }
            const key = JSON.stringify(field.name);
            if (!field.isPrivate && !field.isProtected) result.htmlDoc[tag].attributes[field.name] = {
                name: field.name, description: field.documentation?.fullDefinitions.join("\n") ?? "",
                type: kind as "string" | "number" | "boolean", values: []
            };
            const read = kind === "boolean" ? `this.hasAttribute(${key})` : kind === "number" ? `Number(this.getAttribute(${key}))` : `this.getAttribute(${key}) ?? undefined`;
            const write = kind === "boolean" ? `if (value === true || value === 1 || value === 'true' || value === '') this.setAttribute(${key}, 'true'); else this.removeAttribute(${key});` : `if (value == null) this.removeAttribute(${key}); else this.setAttribute(${key}, String(value));`;
            members += `get [${key}]() { return ${read}; } set [${key}](value) { ${write} }\n`;
            defaults += `if (Object.prototype.hasOwnProperty.call(this, ${key})) { const value = this[${key}]; delete this[${key}]; this[${key}] = value; } else if (!this.hasAttribute(${key})) { this[${key}] = ${field.defaultValue ?? "undefined"}; }\n`;
            if (decorator.name === "Property") {
                observed.push(field.name);
                const callback = PropertyDecorator.is(decorator)?.fctTxt;
                if (callback) callbacks += `case ${key}: (${callback}).call(this, this); break;\n`;
            }
        }
        for (const event of actions?.events ?? []) {
            if (!info.methods[event.fct]) error(`Native event handler ${event.fct} is missing`);
            if (event.isCallback) error("Native components support DOM events only");
        }
        for (const method of [...Object.values(info.methods), ...Object.values(info.methodsStatic)]) {
            if (method.decorators.some(d => !["NoCompile", "Deprecated", "Internal", "InternalProtected", "NoType"].includes(d.name))) error(`Unsupported native method decorator on ${method.name}`);
            if (method.mustBeCompiled) members += method.compiledContent + "\n";
        }
        for (const field of Object.values(info.propertiesStatic)) {
            if (field.decorators.some(d => !["Deprecated", "Internal", "InternalProtected", "NoType"].includes(d.name))) error(`Unsupported native static field decorator on ${field.name}`);
            members += field.compiledContent + "\n";
        }
        const source = nativeComponentExpression({
            name: info.name, tag, members: (info.constructorContent || "constructor() { super(); }") + "\n" + members,
            html: parser?.blocksInfo.default ?? "", css: file.SCSSFile?.compileResult ?? "",
            elements: actions?.elements ?? [], events: actions?.events ?? [], observed, defaults, callbacks
        });
        // Extract the initializer so a compiler-generated "use strict" directive
        // cannot accidentally become the value assigned to the component class.
        const output = transpile(`const __nativeComponent = ${source};`, { target: ScriptTarget.ES2022 });
        const parsed = createSourceFile("native.js", output, ScriptTarget.ES2022, true);
        const statement = parsed.statements.find(isVariableStatement);
        const expression = statement!.declarationList.declarations[0].initializer!.getText(parsed);
        const compiled = AventusTsLanguageService.compileTs(info, file);
        compiled.dependencies = compiled.dependencies.filter(dep => !/NativeWebComponent$/.test(dep.fullName));
        this.build.addNamespace(info.namespace);
        compiled.compiled = `${info.fullName.includes(".") ? "" : "let "}${info.fullName} = ${expression};`;
        if (info.isExported) compiled.compiled += `\n__as1(_${info.namespace ? "." + info.namespace : ""}, ${JSON.stringify(info.name)}, ${info.fullName});`;
        compiled.npm.src = `const ${info.name} = ${expression};\nexport { ${info.name} };`;
        compiled.hotReload = "";
        compiled.tagName = tag;
        compiled.useDecorator = false;
        result.componentName = info.name;
        result.debug = `const ${info.name} = ${expression};\n`;
        if (!result.diagnostics.some(d => d.severity === 1)) {
            result.result.push(compiled);
            result.nativeOutput = { name: `${info.name}.native.js`, content: result.debug };
        }
        return result;
    }
}
