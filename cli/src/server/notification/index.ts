import { CloseFile } from "./CloseFile";
import { Compiled } from "./Compiled";
import { EditFile } from './EditFile';
import { ServerStart } from './httpServer/ServerStart';
import { ServerStop } from './httpServer/ServerStop';
import { InitStep } from './InitStep';
import { OpenFile } from "./OpenFile";
import { OpenPreview } from "./OpenPreview";
import { RegisterBuild } from "./RegisterBuild";
import { RegisterData } from "./RegisterData";
import { RegisterStatic } from "./RegisterStatic";
import { Statistics } from './Statistics';
import { UnregisterBuild } from "./UnregisterBuild";
import { UnregisterData } from "./UnregisterData";
import { UnregisterStatic } from "./UnregisterStatic";


export const Notifications = {
    allNotifications: {
        [CloseFile.cmd]: CloseFile,
        [Compiled.cmd]: Compiled,
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
        [Statistics.loadFileTime.cmd]: Statistics.loadFileTime,
        [Statistics.buildTime.cmd]: Statistics.buildTime,
        [Statistics.sizeFile.cmd]: Statistics.sizeFile,
        [Statistics.staticTime.cmd]: Statistics.staticTime,
    },
}