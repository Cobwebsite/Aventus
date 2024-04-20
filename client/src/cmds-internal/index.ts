import { OpenDebugFile } from './OpenDebugFile';
import { OpenDebugFileSharp } from './sharp/OpenDebugFile';

export const CommandsInternal = {
    allCommandes: {
        [OpenDebugFile.cmd]: OpenDebugFile,
        [OpenDebugFileSharp.cmd]: OpenDebugFileSharp,
    },
}