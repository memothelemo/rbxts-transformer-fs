import ts from "typescript";
import rbxts from "@shared/rbxts";
import { Cache } from "@shared/cache";
import Logger from "@shared/services/logger";

import { Config } from "./config";
import { MacroManager } from "./classes/MacroManager";
import { SymbolProvider } from "./classes/SymbolProvider";
import { f } from "./factory";

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
        Cache.isInitialCompile = true;
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

    public canTransformFiles() {
        return this.symbolProvider.isModuleLoaded();
    }

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

    public getJSDocTagContent(node: ts.Node, tag: string): NonNullable<unknown> | void {
        const tags = ts.getJSDocTags(node);
        for (const { comment, tagName } of tags) {
            if (tagName.text === tag && comment != undefined) {
                return comment;
            }
        }
    }

    private _hasTransformErrors = false;
}
