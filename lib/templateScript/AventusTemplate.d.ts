declare type Version = `${number}.${number}.${number}`;
declare interface InputOptions {
    title?: string;
    value?: string;
    placeHolder?: string,
    validations?: {
        regex: string;
        message: string;
    }[];
}
declare interface SelectOptions {
    placeHolder?: string;
    title?: string;
}
declare interface SelectItem {
    label: string;
    detail?: string;
    picked?: boolean;
}
declare type WriteInfo = {
    templatePath: string;
    writePath: string;
    relativePath: string;
    rawContent: string;
    content: string;
    isDir: boolean;
};
declare type TemplateInfo = {
    /** Determine the name of your template. Each dot will be a group */
    name: string,
    /** Short description to help user */
    description?: string,
    /** Version of your template */
    version?: Version,
    /** Determine if the template can be use without right click */
    allowQuick?: boolean,
    /** Organization from which your template will be published on the store */
    organization?: string,
    /** List of tags to find your template on the store */
    tags?: string[],
    /** Determine if the template is a project or a template */
    isProject?: boolean,
    /** Determine where to install the template */
    installationFolder?: string,
    /** Documentation link for the package */
    documentation?: string,
    /** Repository link for the package */
    repository?: string,
}

declare type WriteCallback = (info: WriteInfo) => void | boolean;
declare type ReservedVariables = "module" | "namespace";
declare type BlockInfo = {
    before: () => string;
    after: () => string;
    custom: (txt: string) => string;
};
declare abstract class AventusTemplate {
    protected abstract meta(): TemplateInfo;
    private basicInfo;
    protected variables: {
        [key: string]: string | null | undefined;
    };
    protected blocks: {
        [key: string]: BlockInfo;
    };
    protected destination: string;
    protected workspacePath: string;
    protected templatePath: string;
    private _run;
    private defaultBlocks(): void;
    protected abstract run(destination: string): Promise<void>;
    /** Ask user with a input */
    protected input(config: InputOptions): Promise<string | null>;
    /** Ask user with a select */
    protected select(items: SelectItem[], options: SelectOptions): Promise<SelectItem | null>;
    /** Ask user with a select with mulitple choices */
    protected selectMultiple(items: SelectItem[], options: SelectOptions): Promise<SelectItem[] | null>;
    private waitingResponse: {
        [cmd: string]: (response: string | null) => void;
    };
    private runCommandWithAnswer;
    private runCommand;
    /** Register a variable that you can use later as ${{var}} */
    protected registerVar<T extends string>(name: T & (T extends ReservedVariables ? never : {}), value: string | null | undefined): void;
    /** Register a block that you can use later as #{{block}} #{{block/}} */
    protected registerBlock(name: string, block: Partial<BlockInfo>): void;
    /** Prevent writing default files/folders */
    protected defaultWriteDeny(info: WriteInfo, denyDir?: string[], denyFile?: string[]): boolean
    /** Start writing process */
    protected writeFile(cb?: WriteCallback): Promise<void>;
    /** Replace ${{var}} inside the content */
    protected replaceVariables(ctx: string): string;
    /** Replace #{{block}} #{{block/}} inside the content */
    protected replaceBlocks(ctx: string): string;
    /** Add \\t before each line */
    protected addIndent(text: string): string;
    /** Remove \\t before each line */
    protected removeIndent(text: string): string;
    /** Exec a command. For example: "npm i" */
    protected exec(cmd: string, asAdmin?: boolean): Promise<void>;
    /** Show a progress bar inside the IDE */
    protected showProgress(txt: string): Promise<string>;
    /** Hide the progress bar inside the IDE */
    protected hideProgress(uuid: string): Promise<void>;
    /** Helper to show then hide a progress bar */
    protected runWithProgress(txt: string, cb: () => Promise<void>): Promise<void>;
    /** Open file. You must define the relative path from the template.avt.ts */
    protected openFile(name: string | string[]): void;
    /** Helper to wait x ms */
    protected sleep(ms: number): Promise<void>;
}