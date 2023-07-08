import { RojoResolver } from "@roblox-ts/rojo-resolver";
import fs from "fs";
import path from "path";
import { PathTranslator } from "shared/classes/PathTranslator";
import { TransformConfig } from "shared/config";
import { CacheService } from "shared/services/CacheService";
import { Logger } from "shared/services/Logger";
import { assert } from "shared/utils/assert";
import { benchmark } from "shared/utils/benchmark";
import { getRootDir } from "shared/utils/getRootDir";
import { CommandLine } from "shared/utils/parseCommandLine";
import ts from "typescript";
import { SymbolProvider } from "./SymbolProvider";
import { ModuleMacroManager } from "./ModuleMacroManager";

export class Project {
  public readonly path: string;
  public readonly sourceDir: string;
  public readonly outputDir: string;

  pathTranslator!: PathTranslator;
  rojoResolver!: RojoResolver;

  public constructor(cmdline: CommandLine, program: ts.Program) {
    this.path = cmdline.projectDir;
    this.sourceDir = getRootDir(program);

    const compilerOptions = program.getCompilerOptions();
    const outputDir = compilerOptions.outDir;
    assert(outputDir, "outDir is missing");

    this.outputDir = outputDir;
    this.setupRojoResolver(cmdline, compilerOptions);
  }

  public relativeTo(to: string) {
    return path.relative(this.path, to);
  }

  private setupRojoResolver(cmdline: CommandLine, compilerOptions: ts.CompilerOptions) {
    let buildInfoOutputPath = ts.getTsBuildInfoEmitOutputFilePath(compilerOptions);
    if (buildInfoOutputPath !== undefined) {
      buildInfoOutputPath = path.normalize(buildInfoOutputPath);
    }

    const declaration = compilerOptions.declaration === true;
    this.pathTranslator = new PathTranslator(this.sourceDir, this.outputDir, buildInfoOutputPath, declaration);

    let configPath: string | undefined;
    if (cmdline.rojoProjectPath) {
      configPath = path.resolve(cmdline.rojoProjectPath);
    } else {
      configPath = RojoResolver.findRojoConfigFilePath(this.path).path;
    }

    assert(configPath, "Cannot find rojo project");

    Logger.debug(`Loading Rojo resolver, config.path = ${this.relativeTo(configPath)}`);
    const [rojoResolver, elapsed] = benchmark(() => CacheService.loadRojoResolver(configPath!));
    this.rojoResolver = rojoResolver;
    Logger.trace(`Successfully loaded Rojo resolver, elapsed = ${elapsed}`);
  }
}

export class TransformState {
  public readonly project: Project;

  public readonly compilerOptions = this.program.getCompilerOptions();
  public readonly typeChecker = this.program.getTypeChecker();

  public symbolProvider!: SymbolProvider;
  public macros!: ModuleMacroManager;

  public constructor(
    cmdline: CommandLine,
    public readonly program: ts.Program,
    public readonly context: ts.TransformationContext,
    public readonly config: TransformConfig,
  ) {
    Logger.debug("Initializing transform state");
    Logger.pushTree();
    const now = Date.now();

    const project = new Project(cmdline, this.program);
    this.project = project;
    this.setupMacros();

    const elapsed = Date.now() - now;
    Logger.popTree();
    Logger.debug(
      `Initialized transform state, src.dir = ${project.relativeTo(project.sourceDir)}, out.dir = ${project.relativeTo(
        project.outputDir,
      )}, elapsed = ${elapsed} ms`,
    );
  }

  public canTransformFiles() {
    // Critical part there
    return this.symbolProvider.isModuleFileLoaded();
  }

  private setupMacros() {
    const symbolProvider = Logger.benchmark("Loading symbols...", true, () => new SymbolProvider(this));
    const moduleMacroManager = Logger.benchmark(
      "Loading all required macros...",
      true,
      () => new ModuleMacroManager(symbolProvider),
    );

    this.symbolProvider = symbolProvider;
    this.macros = moduleMacroManager;

    Logger.trace(`Registered ${moduleMacroManager.countAllMacros()} macros`);
  }

  public getType(node: ts.Node) {
    return this.typeChecker.getTypeAtLocation(node);
  }

  public getSymbol(node: ts.Node, skipAlias = false) {
    const symbol = this.typeChecker.getSymbolAtLocation(node);
    if (symbol && skipAlias) return ts.skipAlias(symbol, this.typeChecker);
    return symbol;
  }

  public emitTransformedFile(printer: ts.Printer, file: ts.SourceFile) {
    const output = printer.printFile(file);
    const emitFilePath = this.project.pathTranslator.getOutputPath(file.fileName).replace(/\.(lua)$/gm, ".transformed");

    Logger.debug(
      `Emitting transformed file, file.path = ${this.project.relativeTo(
        file.fileName,
      )}, out.file = ${this.project.relativeTo(emitFilePath)}`,
    );

    // To avoid errors given from fs module
    const emitDir = path.dirname(emitFilePath);
    if (!fs.existsSync(emitDir)) fs.mkdirSync(emitDir, { recursive: true });
    fs.writeFileSync(emitFilePath, output);
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
}
