declare type Version = `${number}.${number}.${number}`;
declare interface InputOptions {
    title: string;
    value?: string;
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
    openFileOnEnd: () => void;
};
declare type WriteCallback = (info: WriteInfo) => void | boolean;
declare type ReservedVariables = "module" | "namespace";
declare type BlockInfo = {
    before: () => string;
    after: () => string;
    custom: (txt: string) => string;
};
declare abstract class AventusTemplate {
    abstract name(): string;
    abstract description(): string;
    abstract version(): Version;
    private basicInfo;
    protected variables: {
        [key: string]: string | null | undefined;
    };
    protected blocks: {
        [key: string]: BlockInfo;
    };
    protected filesToOpen: string[];
    protected destination: string;
    protected templatePath: string;
    private _run;
    protected defaultBlocks(): void;
    abstract run(destination: string): Promise<void>;
    protected input(config: InputOptions): Promise<string | null>;
    protected select(items: SelectItem[], options: SelectOptions): Promise<SelectItem | null>;
    protected waitingResponse: {
        [cmd: string]: (response: string | null) => void;
    };
    private runCommandWithAnswer;
    private runCommand;
    protected registerVar<T extends string>(name: T & (T extends ReservedVariables ? never : {}), value: string | null | undefined): void;
    protected registerBlock(name: string, block: Partial<BlockInfo>): void;
    protected writeFile(cb: WriteCallback): Promise<void>;
    protected replaceVariables(ctx: string): string;
    protected replaceBlocks(ctx: string): string;
    protected addIndent(text: string): string;
    protected removeIndent(text: string): string;
}

