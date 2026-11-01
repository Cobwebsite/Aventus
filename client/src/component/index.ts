import { Disposable, StatusBarAlignment, StatusBarItem, ThemeColor, window } from "vscode";
import { ServerStop } from '../notification/httpServer/ServerStop';
import { SettingsManager } from '../Settings';

export type TextInfo = { text: string, tooltip?: string, command?: string, color?: string, backgroundColor?: ThemeColor }
type CompilationState = 'idle' | 'progress' | 'success' | 'error';
type ProjectType = 'aventus' | 'sharp' | 'php';
export class AvenutsVsComponent {
    private lastCompiledInfo: StatusBarItem;
    public runningServer: StatusBarItem;

    private info: TextInfo;
    private compilation = new Map<ProjectType, { state: CompilationState, info: TextInfo, order: number }>();
    private compilationOrder = 0;
    private settingsSubscription: Disposable;

    constructor() {
        this.info = {
            text: "$(loading~spin) Aventus : init"
        }
        this.lastCompiledInfo = window.createStatusBarItem("last-compiled-info", StatusBarAlignment.Right, 1000);
        this.lastCompiledInfo.text = this.info.text;
        this.lastCompiledInfo.show();

        this.runningServer = window.createStatusBarItem("running-server", StatusBarAlignment.Right, 999);
        this.runningServer.hide();
        ServerStop.setInfo(this.runningServer);

        this.settingsSubscription = SettingsManager.getInstance().onSettingsChange(() => {
            this.renderInfo();
        })
    }

    public dispose() {
        this.settingsSubscription.dispose();
        this.lastCompiledInfo.dispose();
        this.runningServer.dispose();
    }

    private renderInfo() {
        if (SettingsManager.getInstance().settings.ideBuild) {
            this.lastCompiledInfo.text = this.info.text;
            this.lastCompiledInfo.tooltip = this.info.tooltip;
            this.lastCompiledInfo.command = this.info.command;
            this.lastCompiledInfo.color = this.info.color;
            this.lastCompiledInfo.backgroundColor = this.info.backgroundColor;
        }
        else {
            this.lastCompiledInfo.text = "Compilation is disabled";
            this.lastCompiledInfo.tooltip = undefined;
            this.lastCompiledInfo.command = "aventus.enableBuild";
            this.lastCompiledInfo.color = undefined;
            this.lastCompiledInfo.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
        }
    }

    public setLastCompiledInfo(info: TextInfo) {
        this.info = info;
        this.renderInfo();
    }

    public getLabel(source: ProjectType) {
        if(source == "php") return "Php";
        if(source == "sharp") return "Sharp";
        return "Aventus"
    }

    public setCompilationInfo(source: ProjectType, state: CompilationState, info: TextInfo) {
        if (state === 'idle') this.compilation.delete(source);
        else this.compilation.set(source, { state, info, order: ++this.compilationOrder });

        const entries = [...this.compilation.entries()];
        const errors = entries.filter(([, value]) => value.state === 'error');
        if (errors.length > 0) {
            const primary = errors.find(([name]) => name === 'aventus') ?? errors[0];
            const tooltip = errors.map(([name, value]) => `${this.getLabel(name)}: ${value.info.tooltip ?? value.info.text}`).join('\n');
            this.setLastCompiledInfo({ ...primary[1].info, tooltip });
            return;
        }

        const current = entries.filter(([, value]) => value.state === 'progress');
        const candidates = current.length > 0 ? current : entries;
        candidates.sort((a, b) => b[1].order - a[1].order);
        this.setLastCompiledInfo(candidates[0]?.[1].info ?? { text: '' });
    }

}
