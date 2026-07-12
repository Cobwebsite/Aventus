import { OpenFile as OpenFileI18n } from './i18n/OpenFile';
import { Migration } from './Migration';
import { OpenDebugFile } from './OpenDebugFile';
import { OpenDebugFileSharp } from './sharp/OpenDebugFile';

export const CommandsInternal = {
    allCommandes: {
        [OpenDebugFile.cmd]: OpenDebugFile,
        [OpenFileI18n.cmd]: OpenFileI18n,
        [OpenDebugFileSharp.cmd]: OpenDebugFileSharp,
        [Migration.cmd]: Migration,
    },
}