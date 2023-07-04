import { RojoResolver } from "@roblox-ts/rojo-resolver";
import fs from "fs";
import path from "path";
import { TransformConfig } from "transform/config";
import ts from "typescript";
import { assert } from "utils/functions/assert";
import { RbxtsCommandLine } from "utils/functions/parseCommandLine";
import { getRootDir } from "utils/projectDirs";
import { PathTranslator } from "../../core/classes/PathTranslator";
import { CacheStorage } from "./CacheStorage";
import { Logger } from "core/classes/Logger";
import { SymbolProvider } from "./SymbolProvider";
import { FsMacroManager } from "./MacroManager";

export class RbxtsProject {
  public readonly path: string;
  public readonly rootDir: string;
  public readonly outputDir: string;

  public constructor(cmdline: RbxtsCommandLine, program: ts.Program) {
    const compilerOptions = program.getCompilerOptions();
    this.path = cmdline.projectDir;
    this.rootDir = getRootDir(program);

    assert(compilerOptions.outDir, "outDir is missing");
    this.outputDir = compilerOptions.outDir;
  }
}

export class TransformState {
  public pathTranslator!: PathTranslator;
  public rojoResolver!: RojoResolver;
  public symbolProvider!: SymbolProvider;
  public macroManager!: FsMacroManager;

  public readonly compilerOptions = this.program.getCompilerOptions();
  public readonly project: RbxtsProject = new RbxtsProject(this.cmdline, this.program);
  public readonly typeChecker = this.program.getTypeChecker();

  constructor(
    public readonly program: ts.Program,
    public readonly context: ts.TransformationContext,
    public readonly config: TransformConfig,
    public readonly cmdline: RbxtsCommandLine,
  ) {
    this.setupRojoResolver();
    this.setupAllMacros();

    // CacheStorage.update(config, cmdline);
  }

  public addDiagnosticToTS(diagnostic: ts.DiagnosticWithLocation) {
    this.context.addDiagnostic(diagnostic);
  }

  public canTransformFiles() {
    return this.symbolProvider.isModuleReferenced();
  }

  public getType(node: ts.Node) {
    return this.typeChecker.getTypeAtLocation(node);
  }

  public getSymbol(node: ts.Node, skipAlias = false) {
    const symbol = this.typeChecker.getSymbolAtLocation(node);
    if (symbol && skipAlias) return ts.skipAlias(symbol, this.typeChecker);
    return symbol;
  }

  public emitOutputFile(file: ts.SourceFile) {
    if (!this.config.emitOutputFiles) return;

    const output = CacheStorage.printer.printFile(file);
    const outputFilePath = this.pathTranslator.getOutputPath(file.fileName).replace(/\.(lua)$/gm, ".transformed");
    Logger.debug(
      `Emitting output file, file.path = ${path.relative(this.project.path, file.fileName)}, out.path = ${path.relative(
        this.project.path,
        outputFilePath,
      )}`,
    );

    // Just in case if that directory doesn't exists
    const outputDir = path.dirname(outputFilePath);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputFilePath, output);
  }

  private prereqStmtsStack = new Array<ts.Statement[]>();
  private getCurrentPrereqStmts(): ts.Statement[] | undefined {
    return this.prereqStmtsStack.at(this.prereqStmtsStack.length - 1);
  }

  public addPrereqStmt(statement: ts.Statement) {
    this.getCurrentPrereqStmts()?.push(statement);
  }

  public addPrereqStmts(...statements: ts.Statement[]) {
    this.getCurrentPrereqStmts()?.push(...statements);
  }

  public capturePrereqStmts<T>(callback: () => T): [T, ts.Statement[]] {
    this.prereqStmtsStack.push([]);
    const result = callback();
    return [result, this.prereqStmtsStack.pop()!];
  }

  private setupAllMacros() {
    Logger.debug("Loading symbols...");
    const symbolProvider = Logger.pushTreeWith(() => new SymbolProvider(this));
    this.symbolProvider = symbolProvider;

    if (!this.symbolProvider.isModuleReferenced()) {
      Logger.trace("Module file is not being used. no transformation/s needed");
      return;
    }

    Logger.debug("Loading all required macros...");
    const macroManager = Logger.pushTreeWith(() => new FsMacroManager(this));
    this.macroManager = macroManager;

    Logger.trace(`Registered ${this.macroManager.getTotalMacros()} macros`);
  }

  private setupRojoResolver() {
    // We already resolved the rootDir and outDir in RbxtsProject
    let buildInfoOutputPath = ts.getTsBuildInfoEmitOutputFilePath(this.compilerOptions);
    if (buildInfoOutputPath !== undefined) {
      buildInfoOutputPath = path.normalize(buildInfoOutputPath);
    }

    const declaration = this.compilerOptions.declaration === true;
    this.pathTranslator = new PathTranslator(
      this.project.rootDir,
      this.project.outputDir,
      buildInfoOutputPath,
      declaration,
    );

    const argument = this.cmdline.rojoProjectPath;
    let configPath: string | undefined;

    if (argument && argument !== "") {
      configPath = path.resolve(argument);
    } else {
      configPath = RojoResolver.findRojoConfigFilePath(this.project.path).path;
    }

    assert(configPath, "Cannot find rojo project");

    Logger.debug(`Loading Rojo project, config.path = ${path.relative(this.project.path, configPath)}`);
    this.rojoResolver = CacheStorage.loadRojoProject(configPath);
    Logger.trace("Successfully loaded Rojo project");
  }
}
