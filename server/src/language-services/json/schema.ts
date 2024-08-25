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
            pattern: "^[a-z\-]{2,}$",
        },
        "dependances": { "$ref": "#/$defs/dependances" },
        "namespaceStrategy": {
            type: "string",
            enum: ["manual", "followFolders", "followFoldersCamelCase", "rules"],
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
        "build": {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
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
                    "disabled": {
                        type: "boolean",
                        description: "Disable auto-build",
                        default: true
                    },
                    "hideWarnings": {
                        type: "boolean",
                        description: "Hide warnings for this build"
                    },
                    "componentPrefix": {
                        type: "string",
                        description: "Identifier to prefix all your components (in lower case)",
                        pattern: "^[a-z\-]{2,}$",
                    },
                    "src": {
                        type: "array",
                        items: { type: "string" },
                        description: "List of all pathes to listen watch"
                    },
                    "stories": {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            "output": {
                                type: "string",
                                description: "Define where to export your stories"
                            },
                            "workspace": {
                                type: "string",
                                description: "Define where to add the .storybook"
                            },
                            "live": {
                                type: "boolean",
                                description: "Define if the story content must be recompiled on change",
                            },
                            "format": {
                                type: "string",
                                enum: ["all", "public", "manual"],
                                default: "all",
                                description: "All will export all elements, public only public elements, manual only elements with tag Storybook",
                            },
                            "prefix": {
                                type: "string",
                                description: "Define a prefix for all your stories name. Allow to group stories",
                            }
                        }
                    },
                    "outsideModule": {
                        type: "array",
                        items: { type: "string" },
                        description: "List of all pathes to import outside the module"
                    },
                    "compile": {
                        type: "array",
                        items: {
                            type: "object",
                            additionalProperties: false,
                            properties: {
                                "input": {
                                    type: ["string", "array"],
                                    items: { type: "string" },
                                    description: "List of all pathes to import inside this build"
                                },
                                "output": {
                                    type: ["string", "array"],
                                    items: {
                                        type: "string",
                                        pattern: "^\\S+\\.js",
                                    },
                                    pattern: "^\\S+\\.js",
                                    description: "The script file generated path"
                                },
                                "outputNpm": {
                                    type: ["string", "array", "object"],
                                    additionalProperties: false,
                                    properties: {
                                        "path": {
                                            type: ["string", "array"],
                                        },
                                        "packageJson": {
                                            type: "boolean",
                                            description: "Define if you need to generate a package.json",
                                        }
                                    },
                                    items: {
                                        type: "string",
                                    },
                                    description: "Define where to export as npm files",
                                },
                                "compressed": {
                                    type: "boolean"
                                },
                                "package": {
                                    type: ["string", "array"],
                                    items: {
                                        type: "string",
                                        pattern: "^\\S+\\.package\\.avt",
                                    },
                                    pattern: "^\\S+\\.package\\.avt",
                                    description: "The package file generated path (for lib)"
                                },
                            }
                        }
                    },
                    "dependances": { "$ref": "#/$defs/dependances" },
                    "module": {
                        type: "string",
                        pattern: "^[a-zA-Z0-9_]+$",
                        description: "Name of the exported module for this build"
                    },
                    "namespaceStrategy": {
                        type: "string",
                        enum: ["manual", "followFolders", "followFoldersCamelCase", "rules"],
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

                    "nodeModulesDir": {
                        type: ["string", "array"],
                        items: {
                            type: "string",
                        },
                        description: "The dirs where node_modules are located"
                    },
                },
                required: ["name", "src"]
            },
            minItems: 1
        },
        "static": {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    "name": {
                        type: "string",
                        description: "Part name for the static export",
                        pattern: "^[a-zA-Z0-9_]+$",
                    },
                    "input": {
                        type: "string",
                        description: "Input path to watch to export as static files"
                    },
                    "output": {
                        type: ["string", "array"],
                        items: {
                            type: "string",
                        },
                        description: "Define where to export static files"
                    }
                },
                required: ["name", "input", "output"]
            }
        },
        "avoidParsingInsideTags": {
            type: "array",
            items: {
                type: "string",
                pattern: "^[a-z\-]+$",
            },
            description: "List of html tag that mustn't be parsed by the html compiler"
        },
        "aliases": {
            type: "object"
        }
    },
    "required": ["build", "module"],
    "$defs": {
        "dependances": {
            type: "array",
            description: "List of dependances for this build",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    uri: {
                        type: "string",
                        description: "Where to find the package or the json file"
                    },
                    npm: {
                        type: "string",
                        description: "The npm package name"
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
                        type: "object",
                        description: "Inclusion pattern for each lib. You can use a star to select everythink. If nothink find for a lib, the need value ll be used",
                        patternProperties: {
                            "^\\S+$": {
                                type: "string",
                                enum: ['none', 'need', 'full'],
                                default: "need"
                            }
                        },
                    }
                },
                required: ["uri"]
            }
        }
    }
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
                    additionalProperties: false,
                    properties: {
                        "question": { type: "string" },
                        "type": { type: "string", enum: ["input", "select"] },
                        "defaultValue": { oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] },
                        "list": { type: "object" },
                        "validation": {
                            type: "array",
                            items: {
                                type: "object",
                                additionalProperties: false,
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
        },
        "cmdsAfterAdmin": {
            type: "array",
            items: { type: "string" }
        }
    },
    "required": ["name", "description", "version", "variables"]
}


export const AventusSharpSchema: JSONSchema = {
    "$schema": "foo://aventus/sharp.json",
    "title": "JSON Schema for Aventus",
    "description": "JSON Schema for Aventus",
    "type": "object",
    "additionalProperties": false,
    "properties": {
        "csProj": {
            type: "string",
            pattern: "^\\S+\\.csproj",
        },
        "outputPath": {
            type: "string",
        },
        "exportEnumByDefault": {
            type: "boolean",
            default: false
        },
        "exportStorableByDefault": {
            type: "boolean",
            default: true
        },
        "exportHttpRouteByDefault": {
            type: "boolean",
            default: true
        },
        "exportErrorsByDefault": {
            type: "boolean",
            default: true
        },
        "exportWsEndPointByDefault": {
            type: "boolean",
            default: true
        },
        "exportWsEventByDefault": {
            type: "boolean",
            default: true
        },
        "exportWsRouteByDefault": {
            type: "boolean",
            default: true
        },
        "replacer": {
            type: "object",
            additionalProperties: false,
            properties: {
                "all": { "$ref": "#/$defs/replacerPart" },
                "genericError": { "$ref": "#/$defs/replacerPart" },
                "httpRouter": { "$ref": "#/$defs/replacerPart" },
                "normalClass": { "$ref": "#/$defs/replacerPart" },
                "storable": { "$ref": "#/$defs/replacerPart" },
                "withError": { "$ref": "#/$defs/replacerPart" },
                "wsEndPoint": { "$ref": "#/$defs/replacerPart" },
                "wsEvent": { "$ref": "#/$defs/replacerPart" },
                "wsRouter": { "$ref": "#/$defs/replacerPart" }
            }
        },
        "httpRouter": {
            type: "object",
            additionalProperties: false,
            properties: {
                createRouter: { type: "boolean", default: true },
                autobindRoute: { type: "string", enum: ["none", "auto", "full"], default: "auto" },
                routerName: { type: "string", default: "GeneratedRouter" },
                variableRoutesName: { type: "string", default: "generatedHttpRoutes" },
                uri: { type: "string", default: "", pattern: "^(?=\s*$)|^(\\/[a-zA-Z0-9_-]+?){1,}$" },
                host: { type: "string", default: "https://localhost:5000", pattern: "^http(s)?:\\/\\/[a-zA-Z0-9_-]*?(:[0-9]{3,4})?$" },
                parent: { type: "string", default: "Aventus.HttpRouter" },
                namespace: { type: "string", default: "Routes" }
            }
        },
        "wsEndpoint": {
            type: "object",
            additionalProperties: false,
            properties: {
                prefix: { type: "string", default: "" }
            }
        }
    },
    "required": ["csProj", "outputPath"],
    "$defs": {
        "replacerPart": {
            type: "object",
            additionalProperties: false,
            properties: {
                "type": {
                    type: "object",
                    patternProperties: {
                        "^\\S+$": {
                            type: "object",
                            additionalProperties: false,
                            properties: {
                                "result": {
                                    type: "string"
                                },
                                "file": {
                                    type: "string"
                                },
                                "useTypeImport": {
                                    type: "boolean"
                                }
                            },
                            required: ["result"]
                        }
                    }
                },
                "result": {
                    type: "object",
                    patternProperties: {
                        "^\\S+$": {
                            type: "object",
                            additionalProperties: false,
                            properties: {
                                "result": {
                                    type: "string"
                                },
                                "file": {
                                    type: "string"
                                },
                                "useTypeImport": {
                                    type: "boolean"
                                }
                            },
                            required: ["result"]
                        }
                    }
                }
            },

        }
    }
}