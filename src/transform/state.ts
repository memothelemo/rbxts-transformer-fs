import { TransformConfig } from "@transformer/shared/config";
import { BuildArguments } from "@transformer/shared/rbxts/buildArgs";
import ts from "typescript";
import { RbxtsProject } from "./project";
import { Cache } from "@transformer/shared/cache";
import { f } from "./factory";
import path from "path";
import { SymbolProvider } from "./classes/SymbolProvider";
import Logger from "@transformer/shared/services/logger";
import { MacroManager } from "./classes/MacroManager";

export class TransformState {
  public readonly macro_manager: MacroManager;
  public readonly symbol_provider: SymbolProvider;
  public readonly ts_type_checker = this.ts_program.getTypeChecker();

  public constructor(
    public readonly build_args: BuildArguments,
    public readonly config: TransformConfig,
    public readonly project: RbxtsProject,
    public readonly ts_program: ts.Program,
    public readonly ts_context: ts.TransformationContext,
  ) {
    Cache.is_initial_compile = false;
    f.override(ts_context.factory);

    const sp = Logger.benchmark("Loading symbols", () => new SymbolProvider(this));
    this.symbol_provider = sp;

    const mm = Logger.benchmark("Loading all required macros", () => new MacroManager(this));
    this.macro_manager = mm;

    Logger.debug(`Registered ${mm.countAllLoadedMacros()} macro(s)`);
  }

  public has_transform_errors = false;
  public addDiagnostic(diag: ts.DiagnosticWithLocation) {
    if (diag.category === ts.DiagnosticCategory.Error) {
      this.has_transform_errors = true;
    }
    this.ts_context.addDiagnostic(diag);
  }

  public canTransformFiles() {
    return this.symbol_provider.isModuleFileLoaded && this.macro_manager.isLoaded;
  }

  public getFileId(file: ts.SourceFile) {
    return path.relative(this.project.source_dir, file.fileName).replace(/\\/g, "/");
  }

  public getJSDocTagContent(node: ts.Node, tag: string): NonNullable<unknown> | void {
    const tags = ts.getJSDocTags(node);
    for (const { comment, tagName } of tags) {
      if (tagName.text === tag && comment != undefined) {
        return comment;
      }
    }
  }

  public getLineAndColumnOfNode(node: ts.Node) {
    const file = this.getSourceFileOfNode(node);
    const info = file.getLineAndCharacterOfPosition(node.getStart());
    return { column: info.character + 1, line: info.line + 1 };
  }

  public getType(node: ts.Node) {
    return this.ts_type_checker.getTypeAtLocation(node);
  }

  public getSymbol(node: ts.Node, skip_alias = false) {
    const symbol = this.ts_type_checker.getSymbolAtLocation(node);
    if (symbol && skip_alias) return ts.skipAlias(symbol, this.ts_type_checker);
    return symbol;
  }

  public getSourceFileOfNode(node: ts.Node) {
    const parse_node = ts.getParseTreeNode(node);
    if (!parse_node) throw new Error(`Could not find parse tree node`);
    return ts.getSourceFileOfNode(parse_node);
  }

  private prereq_stmts_stack = new Array<Array<ts.Statement>>();

  public capturePrereqStmts<T>(callback: () => T): [T, ts.Statement[]] {
    this.prereq_stmts_stack.push([]);
    const result = callback();
    return [result, this.prereq_stmts_stack.pop()!];
  }

  public addPrereqStmt(statement: ts.Statement) {
    const stack = this.prereq_stmts_stack[this.prereq_stmts_stack.length - 1];
    if (stack) stack.push(statement);
  }

  public addPrereqStmts(statements: ts.Statement[]) {
    const stack = this.prereq_stmts_stack[this.prereq_stmts_stack.length - 1];
    if (stack) stack.push(...statements);
  }

  public isCapturingPrereqStmts(threshold = 1) {
    return this.prereq_stmts_stack.length > threshold;
  }
}
