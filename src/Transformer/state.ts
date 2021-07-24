import ts from "byots";
import Macro from "../Macro";
import RojoResolver from "../RojoResolver";
import { ProjectType } from "../RojoResolver/constants";
import { PathTranslator } from "../Shared/classes/pathTranslator";
import { SOURCE_MODULE_TEXT } from "../Shared/constants";
import { getPackageJSON } from "../Shared/functions/getPackageJSON";
import { transformSourceFile } from "./functions/transformSourceFile";

export class TransformState {
	public currentDir = this.program.getCurrentDirectory();

	public typeChecker = this.program.getTypeChecker();
	public rojoResolver?: RojoResolver.Project;
	public pathTranslator!: PathTranslator;

	public options = this.program.getCompilerOptions();
	public srcDir = this.options.rootDir ?? this.currentDir;
	public outDir = this.options.outDir ?? this.currentDir;

	public packageName: string;

	public macroManager = new Macro.Manager(this);
	public projectType: ProjectType;

	public constructor(
		public program: ts.Program,
		public context: ts.TransformationContext,
	) {
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
			this.program.getCurrentDirectory(),
		);

		if (rojoConfig) {
			this.rojoResolver = RojoResolver.Project.fromPath(rojoConfig);
		}
	}

	public getSourceFile(node: ts.Node) {
		return ts.getSourceFileOfNode(node);
	}

	public getSymbol(node: ts.Node): ts.Symbol | undefined {
		const symbol = this.typeChecker.getSymbolAtLocation(node);
		return symbol;
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
}
