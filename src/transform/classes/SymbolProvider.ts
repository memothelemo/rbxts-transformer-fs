import { Cache } from "@shared/cache";
import { PACKAGE_NAME } from "@shared/constants";
import Logger from "@shared/services/logger";
import { BaseFileSymbol, BaseNamespaceSymbol } from "@shared/symbol";
import { assert } from "@shared/util/assert";
import { isPathDescendantOf } from "@shared/util/isPathDescendantOf";
import { State } from "@transform/state";
import path from "path";
import ts from "typescript";

export class SymbolProvider {
    public rbxtsTypeDir: string;
    public instanceSymbol: ts.Symbol;

    public constructor(private state: State) {
        this.moduleDir = this.resolveModulePath(PACKAGE_NAME);
        this.rbxtsTypeDir = this.resolveModulePath("@rbxts/types");
        this.resolveModulePath("@rbxts/t");

        for (const file of this.state.tsProgram.getSourceFiles()) {
            if (this.isTransformFile(file)) {
                assert(
                    this.moduleFileSymbol === undefined,
                    `Got duplicated ${PACKAGE_NAME} module file from ${file.fileName} (current: ${this.moduleFileSymbol?.file.fileName})`,
                );
                this.moduleFileSymbol = new ModuleFileSymbol(this.state, file);
            }
        }

        this.instanceSymbol = this.getGlobalSymbolByName(
            "Instance",
            ts.SymbolFlags.Type | ts.SymbolFlags.Interface,
        );
    }

    public get module() {
        assert(this.moduleFileSymbol, "Transformer types are not loaded");
        return this.moduleFileSymbol;
    }

    public isModuleLoaded() {
        return this.moduleFileSymbol !== undefined;
    }

    /////////////////////////////////////////////////////////////////////
    private moduleDir: string;
    private moduleFileSymbol?: ModuleFileSymbol;

    private getGlobalSymbolByName(name: string, meaning: ts.SymbolFlags) {
        const symbol = this.state.tsTypeChecker.resolveName(name, undefined, meaning, false);
        assert(symbol, `Could not find symbol for ${name}!`);
        return symbol;
    }

    private isTransformFile(file: ts.SourceFile) {
        return (
            isPathDescendantOf(file.fileName, this.moduleDir) &&
            !isPathDescendantOf(file.fileName, path.join(this.moduleDir, "node_modules"))
        );
    }

    private resolveModulePath(module: string) {
        const callback = () => {
            return Cache.resolveModuleDir(
                this.state.project.directory,
                this.state.tsProgram.getCompilerOptions(),
                module,
            );
        };

        let path: string | undefined;
        if (this.state.config.$internal.logModuleResolution === true) {
            path = Logger.benchmark("Resolving module path", () => {
                Logger.value("module", module);
                return callback();
            });
        } else {
            path = callback();
        }

        assert(
            path,
            `Failed to resolve module: ${module}. Did you forget to install this package?`,
        );
        return path;
    }
}

export class ModuleFileSymbol extends BaseFileSymbol {
    protected symbol: ts.Symbol;

    public readonly $instance: InstanceNamespaceSymbol;
    public readonly $findInstance: InstanceNamespaceSymbol;
    public readonly $waitForInstance: InstanceNamespaceSymbol;
    public readonly $instances: InstanceNamespaceSymbol;
    public readonly $waitForInstances: InstanceNamespaceSymbol;

    public constructor(state: State, public readonly file: ts.SourceFile) {
        super();

        const symbol = state.getSymbol(file);
        assert(symbol, `Could not get file symbol for ${file.fileName}`);
        this.symbol = symbol;

        this.$instance = new InstanceNamespaceSymbol(this, "$instance");
        this.$findInstance = new InstanceNamespaceSymbol(this, "$findInstance");
        this.$waitForInstance = new InstanceNamespaceSymbol(this, "$waitForInstance");
        this.$instances = new InstanceNamespaceSymbol(this, "$instances");
        this.$waitForInstances = new InstanceNamespaceSymbol(this, "$waitForInstances");
    }
}

// $instance related function handler
export class InstanceNamespaceSymbol extends BaseNamespaceSymbol {
    public readonly callSymbol = this.fileSymbol.expect(this.name);
    public readonly exactCallSymbol: ts.Symbol;

    public constructor(fileSymbol: ModuleFileSymbol, name: string) {
        super(fileSymbol, name);
        this.exactCallSymbol = this.expect("exact");
    }
}
