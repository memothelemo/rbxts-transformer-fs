import ts from "typescript";

/**
 * **TransformContext** is a class where it is responsible
 * and gives context to this transformer.
 */
export class TransformContext {
	/** Original source directory */
	public srcDir: string;

	/** Compiled source directory */
	public outDir: string;

	public constructor(
		/** Current working project directory of the file */
		public projectDir: string,

		/** Compiler options in TypeScript */
		public readonly tsOptions: ts.CompilerOptions,

		/** TypeScript typechecker */
		public readonly typeChecker: ts.TypeChecker,

		/** Transformation context */
		public readonly context: ts.TransformationContext,
	) {
		this.srcDir = this.tsOptions.rootDir ?? this.projectDir;
		this.outDir = this.tsOptions.outDir ?? this.projectDir;
	}

	/** Gets the source file of the node */
	public getSourceFile(node: ts.SourceFile) {
		return ts.getSourceFileOfNode(node);
	}

	/** Gets the symbol node from node argument (if possible) */
	public getSymbol(node: ts.Node): ts.Symbol | undefined {
		const symbol = this.typeChecker.getSymbolAtLocation(node);
		return symbol;
	}
}
