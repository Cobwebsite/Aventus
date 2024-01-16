import { ExecuteCommandParams } from "vscode-languageserver";
import { AddConfigSection } from './addConfigSection';
import { BuildProject } from "./buildProject";
import { Create } from "./create";
import { FileCreated } from './file-system/FileCreated';
import { FileDeleted } from './file-system/FileDeleted';
import { FileUpdated } from './file-system/FileUpdated';
import { MergeComponent } from "./mergeComponent";
import { SplitComponent } from "./splitComponent";
import { StartServer } from './live-server/startServer';
import { ToggleServer } from './live-server/toggleServer';
import { StaticExport } from "./staticExport";
import { StopServer } from './live-server/stopServer';
import { CreateAttribute } from './webcomponent/CreateAttribute';
import { CreateProperty } from './webcomponent/CreateProperty';
import { CreateWatch } from './webcomponent/CreateWatch';
import { ImportViewElement } from './webcomponent/ImportViewElement';
import { ImportViewMethod } from './webcomponent/ImportViewMethod';
import { Rename } from './rename';
import { Rename as RenameComp } from './webcomponent/Rename';
import { OpenAventusFolder } from './file-system/OpenAventusFolder';
import { PopupResponse } from "./PopupResponse";
import { ReceiveInput } from "./ReceiveInput";
import { ReceiveSelect } from "./ReceiveSelect";
import { ReceiveSelectMultiple } from "./ReceiveSelectMultiple";
import { ImportTemplate } from "./file-system/ImportTemplate";
import { SharpExport } from './sharp/export';

export const Commands = {
    allCommandes: {
        [BuildProject.cmd]: BuildProject,
        [StartServer.cmd]: StartServer,
        [StopServer.cmd]: StopServer,
        [ToggleServer.cmd]: ToggleServer,
        [Create.cmd]: Create,
        [Rename.cmd]: Rename,
        [RenameComp.cmd]: RenameComp,
        [MergeComponent.cmd]: MergeComponent,
        [SplitComponent.cmd]: SplitComponent,
        [StaticExport.cmd]: StaticExport,
        [AddConfigSection.cmd]: AddConfigSection,
        [CreateAttribute.cmd]: CreateAttribute,
        [CreateProperty.cmd]: CreateProperty,
        [CreateWatch.cmd]: CreateWatch,
        [ImportViewElement.cmd]: ImportViewElement,
        [ImportViewMethod.cmd]: ImportViewMethod,
        [FileCreated.cmd]: FileCreated,
        [FileUpdated.cmd]: FileUpdated,
        [FileDeleted.cmd]: FileDeleted,
        [OpenAventusFolder.cmd]: OpenAventusFolder,
        [PopupResponse.cmd]: PopupResponse,
        [ReceiveInput.cmd]: ReceiveInput,
        [ReceiveSelect.cmd]: ReceiveSelect,
        [ReceiveSelectMultiple.cmd]: ReceiveSelectMultiple,
        [ImportTemplate.cmd]: ImportTemplate,
        [SharpExport.cmd]: SharpExport
    },
    execute: function (params: ExecuteCommandParams) {
        let cmd = this.allCommandes[params.command];
        if (cmd) {
            let args = params.arguments ?? [];
            (cmd.run as any).call(cmd, ...args);
        }
    }
}