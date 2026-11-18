import { FileBatchChanges, FilesManager } from '../../files/FilesManager';

export class FileBatch {
    static cmd = 'aventus.filesystem.batch';

    static async run(changes: FileBatchChanges) {
        await FilesManager.getInstance().applyBatch(changes);
    }
}
