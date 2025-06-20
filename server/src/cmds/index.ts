import { ExecuteCommandParams } from "vscode-languageserver";
import { AddConfigSection } from './AddConfigSection';
import { BuildProject } from "./BuildProject";
import { Create } from "./Create";
import { FileCreated } from './file-system/FileCreated';
import { FileDeleted } from './file-system/FileDeleted';
import { FileUpdated } from './file-system/FileUpdated';
import { MergeComponent } from "./MergeComponent";
import { SplitComponent } from "./SplitComponent";
import { StartServer } from './live-server/StartServer';
import { ToggleServer } from './live-server/ToggleServer';
import { StaticExport } from "./StaticExport";
import { StopServer } from './live-server/StopServer';
import { CreateAttribute } from './webcomponent/CreateAttribute';
import { CreateProperty } from './webcomponent/CreateProperty';
import { CreateWatch } from './webcomponent/CreateWatch';
import { ImportViewElement } from './webcomponent/ImportViewElement';
import { ImportViewMethod } from './webcomponent/ImportViewMethod';
import { Rename } from './Rename';
import { Rename as RenameComp } from './webcomponent/Rename';
import { OpenAventusFolder } from './file-system/OpenAventusFolder';
import { PopupResponse } from "./PopupResponse";
import { ReceiveInput } from "./ReceiveInput";
import { ReceiveSelect } from "./ReceiveSelect";
import { ReceiveSelectMultiple } from "./ReceiveSelectMultiple";
import { ImportTemplate } from "./file-system/ImportTemplate";
import { SharpExport } from './sharp/Export';
import { ReloadSettings } from './ReloadSettings';
import { CreateCSSVariable } from './webcomponent/CreateCSSVariable';
import { StorybookBuild } from './storybook/Build';
import { ImportProject } from './file-system/ImportProject';
import { NpmBuild } from './npm/Build';
import { AddI18nValue } from './i18n/AddI18nValue';

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
        [CreateCSSVariable.cmd]: CreateCSSVariable,
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
        [ImportProject.cmd]: ImportProject,
        [SharpExport.cmd]: SharpExport,
        [ReloadSettings.cmd]: ReloadSettings,
        [StorybookBuild.cmd]: StorybookBuild,
        [NpmBuild.cmd]: NpmBuild,
        [AddI18nValue.cmd]: AddI18nValue
    },
    execute: function (params: ExecuteCommandParams) {
        let cmd = this.allCommandes[params.command];
        if (cmd) {
            let args = params.arguments ?? [];
            (cmd.run as any).call(cmd, ...args);
        }
    }
}