import ts from "typescript";
import RojoResolver from "../RojoResolver";
import { ProjectType } from "../RojoResolver/constants";
import { PathTranslator } from "../Shared/classes/pathTranslator";
import { SOURCE_MODULE_TEXT } from "../Shared/constants";
import { getPackageJSON } from "../Shared/functions/getPackageJSON";
import { TransformerConfig } from "./config";
import { parseCommandLine } from "./util/parseCommandLine";
import { Logger } from "../Shared/classes/logger";
import kleur from "kleur";

export class TransformState {
	public parsedCommandLine = parseCommandLine();
	public currentDir = this.parsedCommandLine.project;

	private logger = new Logger(
		"Verbose",
		kleur.bgBlue,
		this.config.verboseMode,
	);

	public typeChecker = this.program.getTypeChecker();
	public rojoResolver?: RojoResolver.Project;
	public pathTranslator!: PathTranslator;

	public options = this.program.getCompilerOptions();
	public srcDir = this.options.rootDir ?? this.currentDir;
	public outDir = this.options.outDir ?? this.currentDir;

	public packageName: string;
	public projectType: ProjectType;

	public constructor(
		public program: ts.Program,
		public context: ts.TransformationContext,
		public config: TransformerConfig,
	) {
		if (this.parsedCommandLine.verboseMode && this.config.verboseMode) {
			// roblox-ts doesn't return new line, so it will automatically
			// returns a new line if both verbose modes are activated
			process.stdout.write("\n");
		}

		this.setupRojo();

		const projectPackage = getPackageJSON(this.currentDir);

		this.packageName = projectPackage.name;

		/* ProjectPackage is not the solution here, we need to verify also from RojoResolver */
		if (this.rojoResolver?.isGame) {
			this.projectType = ProjectType.Game;
		} else {
			if (this.packageName.startsWith("@")) {
				this.projectType = ProjectType.Package;
			} else {
				this.projectType = ProjectType.Model;
			}
		}
	}

	public addDiagonstic(diagnostic: ts.DiagnosticWithLocation) {
		this.context.addDiagnostic(diagnostic);
	}

	public isTransformerModule(sourceFile: ts.SourceFile) {
		return sourceFile.text === SOURCE_MODULE_TEXT;
	}

	public printInVerbose(text: string) {
		this.logger.writeIfVerbose(text);
	}

	public setupRojo() {
		this.printInVerbose("Initializing RojoResolver");

		this.pathTranslator = new PathTranslator(
			this.srcDir,
			this.outDir,
			undefined,
			false,
		);

		const rojoConfig = RojoResolver.Project.findRojoConfigFilePath(
			this.currentDir,
		);

		if (rojoConfig) {
			this.rojoResolver = RojoResolver.Project.fromPath(rojoConfig);
		}
	}

	public getSourceFile(node: ts.Node) {
		return ts.getSourceFileOfNode(node);
	}

	public getType(node: ts.Node): ts.Type | undefined {
		const type = this.typeChecker.getTypeAtLocation(node);
		return type;
	}

	public getSymbol(node: ts.Node): ts.Symbol | undefined {
		const symbol = this.typeChecker.getSymbolAtLocation(node);
		return symbol;
	}
}
