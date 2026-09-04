import { Identifier, Symbol, TypeChecker } from 'typescript';

const forbiddenNativeGlobals = new Map([
    ['Date', 'Native Date is not available in Aventus. Import Aventus.Date instead.'],
]);

export function isForbiddenNativeGlobal(node: Identifier, checker: TypeChecker): string | undefined {
    if (!forbiddenNativeGlobals.has(node.text)) return undefined;
    return isForbiddenNativeGlobalSymbol(node.text, checker.getSymbolAtLocation(node));
}

export function isForbiddenNativeGlobalSymbol(name: string, symbol: Symbol | undefined): string | undefined {
    const message = forbiddenNativeGlobals.get(name);
    if (!message) return undefined;
    
    const isNative = symbol?.declarations?.some(declaration => {
        const source = declaration.getSourceFile();
        return source.isDeclarationFile && /(?:^|[/\\])lib\.[^/\\]+\.d\.ts$/.test(source.fileName);
    });
    return isNative ? message : undefined;
}
