import path from "path";
import ts from "typescript";
import Rojo from "../rojo";
import { PathTranslator } from "../shared/classes/pathTranslator";
import { printIfVerbose } from "../shared/functions/print";
import { LogManager } from "../shared/LogManager";
import { SOURCE_MODULE_TEXT } from "../shared/util/package";
import { CommandLine, parseCommandLine } from "../shared/util/parseCommandLine";
import { REQUIRED_FUNCTIONS_BY_NAME } from "./helpers/requiredFunctions";

/**
 * **TransformContext** is a class where it is responsible
 * and gives context to this transformer.
 */
export class TransformContext {
	/**
	 * Each source file requires every function rbxts-transformer-fs provides
	 *
	 * _Each key is a path of every source file_
	 */
	private sourceFileRequires = new Map<string, string[]>();

	/** Parsed command line from arguments configured in CLI */
	public parsedCommandLine: CommandLine;

	/** Current working project directory of the file */
	public readonly projectDir: string;

	/** Original source directory */
	public readonly srcDir: string;

	/** Compiled source directory */
	public readonly outDir: string;

	/** Rojo project itself */
	public rojoProject!: Rojo.Project;

	/** If this project has errors */
	public hasErrors = false;

	/** Made by roblox-ts contributors that allows to predict output paths */
	public pathTranslator: PathTranslator;

	/** Is this the entire project, a game? */
	// in case if rojo.Project goes wrong
	public isGame = false;

	public constructor(
		/** Compiler options in TypeScript */
		public readonly tsOptions: ts.CompilerOptions,

		/** TypeScript typechecker */
		public readonly typeChecker: ts.TypeChecker,

		/** Transformation context */
		public readonly tsContext: ts.TransformationContext,
	) {
		this.parsedCommandLine = parseCommandLine();
		this.projectDir = this.parsedCommandLine.project;

		LogManager.isVerbose = this.parsedCommandLine.verboseMode;

		// roblox-ts is known for not returning a new line nor console.log
		// instead if it is in verbose mode, we need to return a new line
		if (this.parsedCommandLine.verboseMode) {
			LogManager.write("\n");
			printIfVerbose("Loading Rojo project");
		}

		this.srcDir = this.tsOptions.rootDir ?? this.projectDir;
		this.outDir = this.tsOptions.outDir ?? this.projectDir;

		this.pathTranslator = new PathTranslator(
			this.srcDir,
			this.outDir,
			undefined,
			false,
		);

		this.setupRojo();
	}

	/** Adds TypeScript diagnostics */
	public addDiagnostic(diagnostic: ts.DiagnosticWithLocation) {
		if (diagnostic.category === ts.DiagnosticCategory.Error) {
			this.hasErrors = true;
		}
		this.tsContext.addDiagnostic(diagnostic);
	}

	/** Gets the required functions of the source file */
	public getRequiredFunctions(sourceFile: ts.SourceFile) {
		return this.sourceFileRequires.get(sourceFile.path);
	}

	/** Register a required function */
	public addRequiredFunction(
		sourceFile: ts.SourceFile,
		name: typeof REQUIRED_FUNCTIONS_BY_NAME[keyof typeof REQUIRED_FUNCTIONS_BY_NAME],
	) {
		const sourceFilePath = sourceFile.path;
		const array = this.sourceFileRequires.get(sourceFilePath);
		if (!array) {
			this.sourceFileRequires.set(
				sourceFilePath,
				new Array<string>(name),
			);
		} else {
			if (!array.includes(name)) {
				array.push(name);
			}
		}
	}

	/** Checks if the source file requires making functions */
	public isSourceFileNeedsUnshift(sourceFile: ts.SourceFile) {
		return this.sourceFileRequires.has(sourceFile.path);
	}

	/** A conditional function checks if the source file is from the transformer */
	public isTransformerModule(sourceFile: ts.SourceFile) {
		return sourceFile.text === SOURCE_MODULE_TEXT;
	}

	/** Setups rojo project */
	private setupRojo() {
		const rojoConfig = Rojo.Utils.findRojoConfigFilePath(this.projectDir);
		if (rojoConfig) {
			// combining it with the srcDir (bug)
			const trueRojoConfigPath = path.join(this.projectDir, rojoConfig);

			this.rojoProject = Rojo.Project.fromPath(trueRojoConfigPath);
			this.isGame = this.rojoProject.isGame;
		}
	}

	/** Gets the source file of the node */
	public getSourceFile(node: ts.Node) {
		return ts.getSourceFileOfNode(node);
	}

	/** Gets the symbol node from node argument (if possible) */
	public getSymbol(node: ts.Node): ts.Symbol | undefined {
		return this.typeChecker.getSymbolAtLocation(node);
	}

	/** Gets the type node from node argument (if possible) */
	public getType(node: ts.Node) {
		return this.typeChecker.getTypeAtLocation(node);
	}
}
