
export enum AventusType {
    Component,
    Lib,
    Data,
    RAM,
    Socket,
    Static,
    Definition,
    Unknow
}
export const AventusLanguageId = {
    Base: "Aventus",
    TypeScript: "Aventus Ts",
    HTML: "Aventus HTML",
    SCSS: "Aventus SCSS",
    WebComponent: "Aventus WebComponent",
    Package: "Aventus Package"
}
export const AventusExtension = {
    Base: ".avt",
    Config: "aventus.conf.avt",
    CsharpConfig: "aventus.sharp.avt",
    ComponentLogic: ".wcl.avt",
    ComponentView: ".wcv.avt",
    ComponentStyle: ".wcs.avt",
    Component: ".wc.avt",
    ComponentGlobalStyle: ".gwcs.avt",
    GlobalStyle: ".gs.avt",
    Data: ".data.avt",
    Lib: ".lib.avt",
    RAM: ".ram.avt",
    Socket: ".socket.avt",
    State: ".state.avt",
    Static: ".static.avt",
    Definition: ".def.avt",
    Template: "template.avt",
    Package: ".package.avt"
} as const;

export enum AventusErrorCode {
    Unknow = 1000,
    ConfigJsonError,
    NoWebComponent,
    MultipleWebComponent,
    TagLower,
    AttributeLower,
    MissingVariable,
    ParsingParentFailed,
    OutsideInterpolation,
    UsedKeyword,
    MissingAttributeForLoop,
    MissingViewElement,
    viewElementNotFound,
    MissingInit,
    MissingProp,
    MissingWatchable,
    WrongTypeDefinition,
    MissingExtension,
    MissingImplementation,
    MissingMethod,
    FunctionNotAllowed,
    VariableNotAllowed,
    MissingFullName,
    SameNameFound,
    ConvertionImpossible,
    ExclamationMarkMissing,
    QuestionMarkMissing,
}