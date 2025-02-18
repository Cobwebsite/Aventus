export interface IAventusConfig {
    module: string;
    version?: string;
    hideWarnings?: boolean;
    componentPrefix?: string;
    dependances?: IDependence[];
    namespaceStrategy?: 'manual' | 'followFolders' | 'followFoldersCamelCase' | 'rules';
    namespaceRules?: Record<string, any>;
    namespaceRoot?: string;
    build: IBuildConfig[];
    static?: IStaticConfig[];
    avoidParsingInsideTags?: string[];
    aliases?: Record<string, any>;
}

interface IDependence {
    uri: string;
    npm?: string;
    version?: string;
    include?: 'none' | 'need' | 'full';
    subDependancesInclude?: Record<string, 'none' | 'need' | 'full'>;
}

interface IBuildConfig {
    name: string;
    version?: string;
    disabled?: boolean;
    hideWarnings?: boolean;
    componentPrefix?: string;
    src: string[];
    stories?: IStoriesConfig;
    outsideModule?: string[];
    compile?: ICompileConfig[];
    dependances?: IDependence[];
    module?: string;
    namespaceStrategy?: 'manual' | 'followFolders' | 'followFoldersCamelCase' | 'rules';
    namespaceRules?: Record<string, any>;
    namespaceRoot?: string;
    avoidParsingInsideTags?: string[];
    nodeModulesDir?: string | string[];
}

interface IStoriesConfig {
    output?: string;
    workspace?: string;
    live?: boolean;
    format?: 'all' | 'public' | 'manual';
    prefix?: string;
}

interface ICompileConfig {
    input?: string | string[];
    output: string | string[];
    outputNpm?: IOutputNpmConfig | string | string[];
    compressed?: boolean;
    package?: string | string[];
}

interface IOutputNpmConfig {
    path?: string | string[];
    packageJson?: boolean;
    manifest?: boolean,
    live?: boolean;
}

interface IStaticConfig {
    name: string;
    input: string;
    output: string | string[];
}