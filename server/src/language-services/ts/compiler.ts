import { existsSync, unlinkSync, writeFileSync } from "fs";
import { AventusTsFile } from './File';
import { AventusTsLanguageService, CompileTsResult } from "./LanguageService";
import { BaseInfo } from './parser/BaseInfo';


export function genericTsCompile(file: AventusTsFile): CompileTsResult[] {
    let debugTxt = "";
    let result: CompileTsResult[] = [];

    let sectionCompile = (sections: BaseInfo[]) => {
        for(let section of sections) {
            let resultTemp = AventusTsLanguageService.compileTs(section, file);
            file.build.addNamespace(section.namespace);
            result.push(resultTemp);
            debugTxt += resultTemp.debugTxt;
        }
    }
    if (file.fileParsed) {
        sectionCompile(Object.values(file.fileParsed.classes));
        sectionCompile(Object.values(file.fileParsed.enums));
        sectionCompile(Object.values(file.fileParsed.aliases));
        sectionCompile(Object.values(file.fileParsed.functions));
        sectionCompile(Object.values(file.fileParsed.variables));
    }

    let debugPath = file.file.path.replace(".avt", ".js");
    if (debugTxt != "") {
        writeFileSync(debugPath, debugTxt);
    }
    else if (existsSync(debugPath)) {
        unlinkSync(debugPath);
    }
    return result;
}




