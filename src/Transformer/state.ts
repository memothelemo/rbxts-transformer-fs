import ts from "byots";
import kleur from "kleur";
import RojoResolver from "../RojoResolver";
import { Logger } from "../Shared/classes/logger";
import { PathTranslator } from "../Shared/classes/pathTranslator";
import { assert } from "../Shared/functions/assert";
import { getPackageJSON } from "../Shared/functions/getPackageJSON";
import { transformSourceFile } from "./functions/transformSourceFile";

export class TransformState {
	public typeChecker = this.program.getTypeChecker();
	public verboseLogger = new Logger("VERBOSE", kleur.bold, true);

	public currentDir = this.program.getCurrentDirectory();
	public options = this.program.getCompilerOptions();

	public srcDir = this.options.rootDir ?? this.currentDir;
	public outDir = this.options.outDir ?? this.currentDir;

	public rojoResolver!: RojoResolver.Project;
	public pathTranslator!: PathTranslator;

	public packageName: string;
	public isGame: boolean;

	private replacedSourceFiles = new Map<ts.SourceFile, boolean>();

	constructor(
		public program: ts.Program,
		public context: ts.TransformationContext,
	) {
		this.setupRojo();

		const projectPackage = getPackageJSON(this.currentDir);
		assert(projectPackage !== undefined, `Expected "package.json"`);

		this.packageName = projectPackage.name;
		this.isGame = !projectPackage.name.startsWith("@");
	}

	public isSourceFileReplaced(sourceFile: ts.SourceFile) {
		if (this.replacedSourceFiles.has(sourceFile)) {
			return this.replacedSourceFiles.get(sourceFile);
		}
		return false;
	}

	public setSourceFileReplaced(sourceFile: ts.SourceFile) {
		this.replacedSourceFiles.set(sourceFile, true);
	}

	public setupRojo() {
		this.pathTranslator = new PathTranslator(
			this.srcDir,
			this.outDir,
			undefined,
			false,
		);

		const rojoConfig = RojoResolver.Project.findRojoConfigFilePath(
			this.program.getCurrentDirectory(),
		);

		if (rojoConfig) {
			this.rojoResolver = RojoResolver.Project.fromPath(rojoConfig);
		}
	}

	public getSourceFile(node: ts.Node) {
		return ts.getSourceFileOfNode(node);
	}

	public transformAll() {
		const map = new Map<ts.SourceFile, ts.SourceFile>();
		this.program
			.getSourceFiles()
			.forEach(source =>
				map.set(source, transformSourceFile(this, source)),
			);
		return map;
	}

	public getSymbol(node: ts.Node, aliased = true): ts.Symbol | undefined {
		const symbol = this.typeChecker.getSymbolAtLocation(node);
		if (symbol) {
			return aliased &&
				ts.SymbolFlags.Alias === (symbol.flags & ts.SymbolFlags.Alias)
				? this.typeChecker.getAliasedSymbol(symbol)
				: symbol;
		}
	}
}
