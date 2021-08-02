import ts from "typescript";
import RojoResolver from "../RojoResolver";
import { ProjectType } from "../RojoResolver/constants";
import { PathTranslator } from "../Shared/classes/pathTranslator";
import { SOURCE_MODULE_TEXT } from "../Shared/constants";
import { getPackageJSON } from "../Shared/functions/getPackageJSON";
import { TransformerConfig } from "./config";
import path from "path";
import { parseCommandLine } from "./util/parseCommandLine";

export class TransformState {
	public parsedCommandLine = parseCommandLine();
	public currentDir = this.parsedCommandLine.project;

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

	public setupRojo() {
		this.pathTranslator = new PathTranslator(
			this.srcDir,
			this.outDir,
			undefined,
			false,
		);

		const rojoConfig = RojoResolver.Project.findRojoConfigFilePath(
			this.config.projectFile
				? path.join(this.currentDir, this.config.projectFile)
				: this.currentDir,
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
