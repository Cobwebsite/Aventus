import { join } from 'path';
import { ClassDeclaration, createProgram, EnumDeclaration, FunctionDeclaration, InterfaceDeclaration, MethodDeclaration, SyntaxKind, TypeAliasDeclaration, VariableDeclaration } from 'typescript';
import { TYPESCRIPT_LIB_SOURCE } from '../libLoader';

export class BaseLibInfo {
    private static libInfo: string[] = [];
    private static init() {
        let prog = createProgram([join(TYPESCRIPT_LIB_SOURCE(), "lib.es2022.full.d.ts")], {});
        let files = prog.getSourceFiles();
        for (let file of files) {
            if (file.statements) {
                for (let st of file.statements) {
                    try {
                        if(st.kind == SyntaxKind.FunctionDeclaration){
                            let name = (st as FunctionDeclaration).name?.getText(file);
                            if(name){
                                if (!this.libInfo.includes(name)) {
                                    this.libInfo.push(name)
                                }
                            }
                        }
                        else if(st.kind == SyntaxKind.EnumDeclaration){
                            let name = (st as EnumDeclaration).name?.getText(file);
                            if(name){
                                if (!this.libInfo.includes(name)) {
                                    this.libInfo.push(name)
                                }
                            }
                        } 
						else if(st.kind == SyntaxKind.ClassDeclaration){
                            let name = (st as ClassDeclaration).name?.getText(file);
                            if(name){
                                if (!this.libInfo.includes(name)) {
                                    this.libInfo.push(name)
                                }
                            }
                        }
						else if(st.kind == SyntaxKind.MethodDeclaration){
                            let name = (st as any as MethodDeclaration).name?.getText(file);
                            if(name){
                                if (!this.libInfo.includes(name)) {
                                    this.libInfo.push(name)
                                }
                            }
                        }
						else if(st.kind == SyntaxKind.VariableDeclaration){
                            let name = (st as any as VariableDeclaration).name?.getText(file);
                            if(name){
                                if (!this.libInfo.includes(name)) {
                                    this.libInfo.push(name)
                                }
                            }
                        }
						else if(st.kind == SyntaxKind.InterfaceDeclaration){
                            let name = (st as InterfaceDeclaration).name?.getText(file);
                            if(name){
                                if (!this.libInfo.includes(name)) {
                                    this.libInfo.push(name)
                                }
                            }
                        }
						else if(st.kind == SyntaxKind.TypeAliasDeclaration){
                            let name = (st as TypeAliasDeclaration).name?.getText(file);
                            if(name){
                                if (!this.libInfo.includes(name)) {
                                    this.libInfo.push(name)
                                }
                            }
                        }
                        
                        
                    } catch { }
                }
            }
        }
    }
    public static exists(name: string): boolean {
        if (this.libInfo.length == 0) {
            this.init();
        }
        return this.libInfo.includes(name);
    }
}