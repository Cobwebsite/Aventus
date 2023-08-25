import { AddConfigSection } from './AddConfigSection';
import { BuildProject } from "./BuildProject";
import { Create } from "./Create";
import { FileCreated } from './file-system/FileCreated';
import { FileDeleted } from './file-system/FileDeleted';
import { FileUpdated } from './file-system/FileUpdated';
import { TemplateImport } from './file-system/ImportTemplate';
import { OpenAventusFolder } from './file-system/OpenAventusFolder';
import { Rename } from './Rename';
import { Rename as RenameComp } from './webcomponent/Rename';
import { ShowDependances } from './ShowDependances';
import { StaticExport } from "./StaticExport";
import { CreateAttribute } from './webcomponent/CreateAttribute';
import { CreateProperty } from './webcomponent/CreateProperty';
import { CreateWatch } from './webcomponent/CreateWatch';
import { ImportViewElement } from './webcomponent/ImportViewElement';
import { ImportViewMethod } from './webcomponent/ImportViewMethod';
import { ReceiveSelect } from './ReceiveSelect';
import { ReceiveInput } from './ReceiveInput';
import { PopupResponse } from './PopupResponse';
import { ReceiveSelectMultiple } from './ReceiveSelectMultiple';
import { MergeComponent } from './MergeComponent';
import { SplitComponent } from './SplitComponent';


export const Commands = {
    allCommandes: {
        [Create.cmd]: Create,
        [Rename.cmd]: Rename,
        [RenameComp.cmd]: RenameComp,
        [BuildProject.cmd]: BuildProject,
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
        [TemplateImport.cmd]: TemplateImport,
        [ShowDependances.cmd]: ShowDependances,
        [OpenAventusFolder.cmd]: OpenAventusFolder,
        [ReceiveInput.cmd]: ReceiveInput,
        [ReceiveSelect.cmd]: ReceiveSelect,
        [ReceiveSelectMultiple.cmd]: ReceiveSelectMultiple,
        [PopupResponse.cmd]: PopupResponse,
        [MergeComponent.cmd]: MergeComponent,
        [SplitComponent.cmd]: SplitComponent,
    },
}