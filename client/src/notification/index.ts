import { AskInput } from './AskInput';
import { AskSelect } from './AskSelect';
import { AskSelectMultiple } from './AskSelectMultiple';
import { CloseFile } from "./CloseFile";
import { Compiled } from "./Compiled";
import { CompiledPart } from "./CompiledPart";
import { EditFile } from './EditFile';
import { ServerStart } from './httpServer/ServerStart';
import { ServerStop } from './httpServer/ServerStop';
import { InitStep } from './InitStep';
import { LoadingStart } from './LoadingStart';
import { LoadingStop } from './LoadingStop';
import { OpenFile } from "./OpenFile";
import { OpenPreview } from "./OpenPreview";
import { Popup } from './Popup';
import { RegisterBuild } from "./RegisterBuild";
import { RegisterData } from "./RegisterData";
import { RegisterStatic } from "./RegisterStatic";
import { UnregisterBuild } from "./UnregisterBuild";
import { UnregisterData } from "./UnregisterData";
import { UnregisterStatic } from "./UnregisterStatic";


export const Notifications = {
    allNotifications: {
        [CloseFile.cmd]: CloseFile,
        [Compiled.cmd]: Compiled,
        [CompiledPart.cmd]: CompiledPart,
        [ServerStart.cmd]: ServerStart,
        [ServerStop.cmd]: ServerStop,
        [OpenFile.cmd]: OpenFile,
        [OpenPreview.cmd]: OpenPreview,
        [RegisterBuild.cmd]: RegisterBuild,
        [RegisterData.cmd]: RegisterData,
        [RegisterStatic.cmd]: RegisterStatic,
        [UnregisterBuild.cmd]: UnregisterBuild,
        [UnregisterData.cmd]: UnregisterData,
        [UnregisterStatic.cmd]: UnregisterStatic,
        [EditFile.cmd]: EditFile,
        [InitStep.cmd]: InitStep,
        [AskInput.cmd]: AskInput,
        [AskSelect.cmd]: AskSelect,
        [AskSelectMultiple.cmd]: AskSelectMultiple,
        [Popup.cmd]: Popup,
        [LoadingStart.cmd]: LoadingStart,
        [LoadingStop.cmd]: LoadingStop
    },
}