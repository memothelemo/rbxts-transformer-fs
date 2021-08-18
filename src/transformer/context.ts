import ts from "typescript";
import Rojo from "../rojo";
import { SOURCE_MODULE_TEXT } from "../shared/util/package";

/**
 * **TransformContext** is a class where it is responsible
 * and gives context to this transformer.
 */
export class TransformContext {
	/** Each source file requires every function rbxts-transformer-fs provides */
	private sourceFileRequires = new Map<ts.SourceFile, string[]>();

	/** Original source directory */
	public srcDir: string;

	/** Compiled source directory */
	public outDir: string;

	/** Rojo project itself */
	public rojoProject!: Rojo.Project;

	/** Is this the entire project, a game? */
	// in case if rojo.Project goes wrong
	public isGame = false;

	public constructor(
		/** Current working project directory of the file */
		public readonly projectDir: string,

		/** Compiler options in TypeScript */
		public readonly tsOptions: ts.CompilerOptions,

		/** TypeScript typechecker */
		public readonly typeChecker: ts.TypeChecker,

		/** Transformation context */
		public readonly tsContext: ts.TransformationContext,
	) {
		this.srcDir = this.tsOptions.rootDir ?? this.projectDir;
		this.outDir = this.tsOptions.outDir ?? this.projectDir;

		this.setupRojo();
	}

	/** Adds TypeScript diagnostics */
	public addDiagnostic(diagnostic: ts.DiagnosticWithLocation) {
		this.tsContext.addDiagnostic(diagnostic);
	}

	/** Gets the required functions of the source file */
	public getRequiredFunctions(sourceFile: ts.SourceFile) {
		return this.sourceFileRequires.get(sourceFile);
	}

	/** Checks if the source file requires making functions */
	public isSourceFileNeedsUnshift(sourceFile: ts.SourceFile) {
		return this.sourceFileRequires.has(sourceFile);
	}

	/** A conditional function checks if the source file is from the transformer */
	public isTransformerModule(sourceFile: ts.SourceFile) {
		return sourceFile.text === SOURCE_MODULE_TEXT;
	}

	/** Setups rojo project */
	private setupRojo() {
		const rojoConfig = Rojo.Utils.findRojoConfigFilePath(this.projectDir);
		if (rojoConfig) {
			this.rojoProject = Rojo.Project.fromPath(rojoConfig);
		}
	}

	/** Gets the source file of the node */
	public getSourceFile(node: ts.Node) {
		return ts.getSourceFileOfNode(node);
	}

	/** Gets the symbol node from node argument (if possible) */
	public getSymbol(node: ts.Node): ts.Symbol | undefined {
		const symbol = this.typeChecker.getSymbolAtLocation(node);
		return symbol;
	}
}
