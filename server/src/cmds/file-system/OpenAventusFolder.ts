import { GenericServer } from '../../GenericServer';
import { existsSync, mkdirSync } from 'fs';
import { platform } from 'os';
import { spawn } from 'child_process';

export class OpenAventusFolder {
    static cmd: string = "aventus.filesystem.openAventus";

    
    public static async run() {
        let storagePath = GenericServer.savePath;
        if (!existsSync(storagePath)) {
            mkdirSync(storagePath);
        }
        let explorer;
        switch (platform()) {
            case "win32": explorer = "explorer"; break;
            case "linux": explorer = "xdg-open"; break;
            case "darwin": explorer = "open"; break;
        }
        let argsCmd: string[] = [storagePath];

        spawn(explorer, argsCmd, { detached: true }).unref();
    }
}