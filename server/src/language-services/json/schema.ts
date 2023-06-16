import { JSONSchema } from 'vscode-json-languageservice';

export const AventusConfigSchema: JSONSchema = {
    "$schema": "foo://aventus/conf.json",
    "title": "JSON Schema for Aventus",
    "description": "JSON Schema for Aventus",
    "type": "object",
    "additionalProperties": false,
    "properties": {
        "module": {
            type: "string",
            pattern: "^[a-zA-Z0-9_]+$",
            description: "Name of the exported module"
        },
        "version": {
            type: "string",
            pattern: "^[0-9]+\.[0-9]+\.[0-9]+$",
            description: "Version for all your builds (x.x.x)"
        },
        "hideWarnings": {
            type: "boolean",
            description: "Hide warnings for all your builds"
        },
        "componentPrefix": {
            type: "string",
            description: "Identifier to prefix all your components (in lower case)",
            pattern: "^[a-z]{2,}$",
        },
        "build": {
            type: "array",
            items: {
                type: "object",
                properties: {
                    "name": {
                        type: "string",
                        description: "Part name for the module. The export file will be ${module}@${name}",
                        pattern: "^[a-zA-Z0-9_]+$",
                    },
                    "version": {
                        type: "string",
                        pattern: "^[0-9]+\.[0-9]+\.[0-9]+$",
                        description: "Version for this build (x.x.x)"
                    },
                    "hideWarnings": {
                        type: "boolean",
                        description: "Hide warnings for this build"
                    },
                    "componentPrefix": {
                        type: "string",
                        description: "Identifier to prefix all your components (in lower case)",
                        pattern: "^[a-z]{2,}$",
                    },
                    "inputPath": {
                        type: "array",
                        items: { type: "string" },
                        description: "List of all pathes to import inside this build"
                    },
                    "outsideModulePath": {
                        type: "array",
                        items: { type: "string" },
                        description: "List of all pathes to import outside the module"
                    },
                    "outputFile": {
                        type: "string",
                        pattern: "^\\S+\\.js",
                        description: "The script file generated path"
                    },
                    "outputPackage": {
                        type: "string",
                        pattern: "^\\S+\\.package\\.avt",
                        description: "The package file generated path (for lib)"
                    },
                    "dependances": {
                        type: "array",
                        description: "List of dependances for this build",
                        items: {
                            type: "object",
                            properties: {
                                uri: {
                                    type: "string",
                                    description: "Where to find the package or the json file"
                                },
                                version: {
                                    type: "string",
                                    pattern: "^[0-9x]+\.[0-9x]+\.[0-9x]+$",
                                    description: "The version to use for this file. (default is x.x.x)",
                                    default: "x.x.x",
                                },
                                include: {
                                    type: "string",
                                    description: "Determine if the package must be included inside the final export. (default is need)",
                                    enum: ['none', 'need', 'full'],
                                    default: "need"
                                },
                                subDependancesInclude: {
                                    type: "array",
                                    description: "Inclusion pattern for each lib. You can use a star to select everythink. If nothink find for a lib, the need value ll be used",
                                    items: {
                                        type: "object",
                                        patternProperties: {
                                            "^\\S+$": {
                                                type: "string",
                                                enum: ['none', 'need', 'full'],
                                                default: "need"
                                            }
                                        },
                                    }
                                }
                            },
                            required: ["uri"]
                        }
                    },
                    "module": {
                        type: "string",
                        pattern: "^[a-zA-Z0-9_]+$",
                        description: "Name of the exported module for this build"
                    },
                    "namespaceStrategy": {
                        type: "string",
                        enum: ["manual", "followFolders", "rules"],
                        description: "Stragety to generate namespace",
                        default: "manual"
                    },
                    "namespaceRules": {
                        type: "object",
                        description: "Rules to define namespace when namespaceStrategy is rules"
                    },
                    "namespaceRoot": {
                        type: "string",
                        description: "Root directory to define namespace when namespaceStrategy is followFolders"

                    },
                    "avoidParsingInsideTags": {
                        type: "array",
                        items: {
                            type: "string",
                            pattern: "^[a-z\-]+$",
                        },
                        description: "List of html tag that mustn't be parsed by the html compiler"
                    },
                    "componentStyle": {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                "name": {
                                    type: "string",
                                    pattern: "^[a-zA-Z0-9_@]+$",
                                    description: "The name of stylesheet"
                                },
                                "path": {
                                    type: "string",
                                    pattern: "^\\S+\\.gwcs.avt$",
                                    description: "Where the file is located"
                                },
                                "outputFile": {
                                    type: "string",
                                    pattern: "^\\S+\\.css$",
                                    description: "If set, the css will be exported outisde of the .js file"
                                }
                            },
                            required: ["name", "path"]
                        },
                        description: "Indicate the global style to load"
                    }
                },
                required: ["name", "inputPath"],
                additionalProperties: false
            },
            minItems: 1
        },
        "static": {
            type: "array",
            items: {
                type: "object",
                properties: {
                    "name": {
                        type: "string",
                        description: "Part name for the static export",
                        pattern: "^[a-zA-Z0-9_]+$",
                    },
                    "inputPath": {
                        type: "string",
                        description: "Input path to watch to export as static files"
                    },
                    "outputPath": {
                        type: "string",
                        description: "Define where to export static files"
                    }
                },
                required: ["name", "inputPath", "outputPath"],
                additionalProperties: false
            }
        },
        "avoidParsingInsideTags": {
            type: "array",
            items: {
                type: "string",
                pattern: "^[a-z\-]+$",
            },
            description: "List of html tag that mustn't be parsed by the html compiler"
        }
    },
    "required": ["build", "componentPrefix", "module"]
};

export const AventusTemplateSchema: JSONSchema = {
    "$schema": "foo://aventus/template.json",
    "title": "JSON Schema for Aventus Template",
    "description": "JSON Schema for Aventus Template",
    "type": "object",
    "additionalProperties": false,
    "properties": {
        "name": { type: "string" },
        "description": { type: "string" },
        "version": {
            type: "string",
            pattern: "^[0-9]+\.[0-9]+\.[0-9]+$"
        },
        "variables": {
            type: "object",
            patternProperties: {
                "^.*$": {
                    type: "object",
                    properties: {
                        "question": { type: "string" },
                        "type": { type: "string", enum: ["input", "select"] },
                        "defaultValue": { oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] },
                        "list": { type: "object" },
                        "validation": {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    "pattern": {
                                        type: "string"
                                    },
                                    "errorMsg": {
                                        type: "string"
                                    }
                                },
                                required: ["pattern"]
                            }
                        }

                    },
                    "required": ["question", "type"]
                }
            },
        },
        "filesToOpen": {
            type: "array",
            items: { type: "string" },
        },
        "cmdsAfter": {
            type: "array",
            items: { type: "string" }
        }
    },
    "required": ["name", "description", "version", "variables"]
}