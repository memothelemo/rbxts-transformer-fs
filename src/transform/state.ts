import ts from "typescript";
import rbxts from "@shared/rbxts";
import { Cache } from "@shared/cache";
import Logger from "@shared/services/logger";

import { Config } from "./config";
import { MacroManager } from "./classes/MacroManager";
import { SymbolProvider } from "./classes/SymbolProvider";
import { transformNode } from "./nodes/transformNode";
import { f } from "./factory";

interface ImportInfo {
    path: string;
    entries: { name: string; identifier: ts.Identifier }[];
}

export class State {
    public readonly macroManager: MacroManager;
    public readonly symbolProvider: SymbolProvider;
    public readonly tsTypeChecker = this.tsProgram.getTypeChecker();

    public constructor(
        public readonly config: Config,
        public readonly project: rbxts.Project,
        public readonly tsProgram: ts.Program,
        public readonly tsContext: ts.TransformationContext,
    ) {
        Cache.isInitialCompile = false;
        f.override(tsContext.factory);

        const symbolProvider = Logger.benchmark(
            "Loading SymbolProvider",
            () => new SymbolProvider(this),
        );
        this.symbolProvider = symbolProvider;

        const macroManager = Logger.benchmark("Loading macro manager", () => {
            const manager = new MacroManager(this);
            Logger.value("manager.loadedMacros", manager.loadedMacros);
            return manager;
        });
        this.macroManager = macroManager;
    }

    public commentNode(node: ts.Node, message: string, trailling = false) {
        // if the message has 2 two lines, then better use multline
        let useMultiline = false;
        if (message.split("\n").length > 1) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            useMultiline = true;
        }

        const kind = useMultiline
            ? ts.SyntaxKind.MultiLineCommentTrivia
            : ts.SyntaxKind.SingleLineCommentTrivia;

        if (trailling) {
            ts.addSyntheticTrailingComment(node, kind, message, true);
        } else {
            ts.addSyntheticLeadingComment(node, kind, message, true);
        }
    }

    public fileImports = new Map<string, ImportInfo[]>();

    public addFileImport(file: ts.SourceFile, importPath: string, name: string) {
        let importInfos = this.fileImports.get(file.fileName);
        if (!importInfos) this.fileImports.set(file.fileName, (importInfos = []));

        let importInfo = importInfos.find(v => v.path === importPath);
        if (!importInfo) importInfos.push((importInfo = { path: importPath, entries: [] }));

        let identifier = importInfo.entries.find(x => x.name === name)?.identifier;
        if (!identifier) {
            start: for (const statement of file.statements) {
                if (!f.is.importDeclaration(statement)) continue;
                if (!f.is.string(statement.moduleSpecifier)) continue;
                if (!statement.importClause || !f.is.importClause(statement.importClause)) continue;
                if (
                    !statement.importClause.namedBindings ||
                    !f.is.namedImports(statement.importClause.namedBindings)
                )
                    continue;
                if (statement.moduleSpecifier.text !== importPath) continue;

                for (const element of statement.importClause.namedBindings.elements) {
                    if (element.propertyName) {
                        if (element.propertyName.text === name) {
                            identifier = element.name;
                            break start;
                        }
                    } else if (element.name.text === name) {
                        identifier = element.name;
                        break start;
                    }
                }
            }
        }
        if (!identifier) {
            importInfo.entries.push({ name, identifier: (identifier = f.identifier(name, true)) });
        }
        return identifier!;
    }

    public canTransformFiles() {
        return this.symbolProvider.isModuleLoaded();
    }

    private _hasTransformErrors = false;
    public get hasTransformErrors() {
        return this._hasTransformErrors;
    }

    public addDiagnostic(diag: ts.DiagnosticWithLocation) {
        if (diag.category === ts.DiagnosticCategory.Error) {
            this._hasTransformErrors = true;
        }
        this.tsContext.addDiagnostic(diag);
    }

    public getType(node: ts.Node) {
        return this.tsTypeChecker.getTypeAtLocation(node);
    }

    public getSymbol(node: ts.Node, skip_alias = false) {
        const symbol = this.tsTypeChecker.getSymbolAtLocation(node);
        if (symbol && skip_alias) return ts.skipAlias(symbol, this.tsTypeChecker);
        return symbol;
    }

    public getSourceFileOfNode(node: ts.Node) {
        const parsedNode = ts.getParseTreeNode(node);
        if (!parsedNode) throw new Error(`Could not find parse tree node`);
        return ts.getSourceFileOfNode(parsedNode);
    }

    public getLineAndColumnOfNode(node: ts.Node) {
        const file = this.getSourceFileOfNode(node);
        const info = file.getLineAndCharacterOfPosition(node.getStart());
        return { column: info.character + 1, line: info.line + 1 };
    }

    public getJSDocTagContent(
        node: ts.Node,
        tag: string,
    ): NonNullable<string | ts.NodeArray<ts.JSDocComment>> | undefined {
        const tags = ts.getJSDocTags(node);
        for (const { comment, tagName } of tags) {
            if (tagName.text === tag && comment != undefined) {
                return comment;
            }
        }
        return undefined;
    }

    public transformChildrenOfNode<T extends ts.Node>(node: T): T {
        return ts.visitEachChild(node, newNode => transformNode(this, newNode), this.tsContext);
    }

    private prereqStack = new Array<Array<ts.Statement>>();

    public capture<T>(cb: () => T): [T, ts.Statement[]] {
        this.prereqStack.push([]);

        const result = cb();
        return [result, this.prereqStack.pop()!];
    }

    public prereq(statement: ts.Statement) {
        const stack = this.prereqStack[this.prereqStack.length - 1];
        if (stack) stack.push(statement);
    }

    public prereqList(statements: ts.Statement[]) {
        const stack = this.prereqStack[this.prereqStack.length - 1];
        if (stack) stack.push(...statements);
    }

    public isCapturing(threshold = 1) {
        return this.prereqStack.length > threshold;
    }

    public expectsTestingError(node: ts.Node): boolean {
        if (this.config.$internal.testing !== true) return false;

        const content = this.getJSDocTagContent(node, "transformer-fs");
        if (!content) return false;

        if (typeof content === "string") {
            return content === "expect-error";
        } else {
            return content.some(v => v.text === "expect-error");
        }
    }
}
