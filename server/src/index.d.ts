import * as typescript from 'typescript'

declare module 'typescript' {
	export function getTokenAtPosition(sourceFile: SourceFile, position: number): Node
}