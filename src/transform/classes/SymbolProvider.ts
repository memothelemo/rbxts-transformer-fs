import { assert } from "@transformer/shared/util/assert";
import Logger from "@transformer/shared/services/logger";
import { Cache } from "@transformer/shared/cache";

import fs from "fs";
import path from "path";
import ts from "typescript";
import { TransformState } from "../state";
import { PACKAGE_NAME } from "@transformer/shared/consts";
import { isPathDescendantOf } from "@transformer/shared/util/isPathDescendantOf";

export class SymbolProvider {
  private rbxts_types_dir: string;

  private module_file_symbol?: FileSymbol;
  private module_dir: string;

  public constructor(private state: TransformState) {
    this.module_dir = this.resolveModulePath(PACKAGE_NAME);
    this.rbxts_types_dir = this.resolveModulePath("@rbxts/types");

    this.loadFileSymbols();
  }

  public isFromRobloxTypes(symbol: ts.Symbol) {
    console.log(symbol);
    return false;
  }

  public get module_file() {
    assert(this.module_file_symbol, "Transformer types file is not loaded");
    return this.module_file_symbol;
  }

  public get isModuleFileLoaded() {
    return this.module_file_symbol !== undefined;
  }

  private loadFileSymbols() {
    for (const file of this.state.ts_program.getSourceFiles()) {
      if (this.isTransformFile(file)) {
        this.module_file_symbol = new FileSymbol(this.state, file);
      }
    }
  }

  private resolveModulePath(module: string) {
    const module_path = Logger.benchmark("Resolving module path", () => {
      Logger.debugValue("module", module);

      const compiler_options = this.state.ts_program.getCompilerOptions();
      const cached_module_path = Cache.module_resolution.get(module);
      if (cached_module_path) {
        Logger.debug("cache hit; reusing cached module path");
        Logger.debugValue("cached_module_path", cached_module_path);
        return cached_module_path || undefined;
      }
      Logger.debug("cache miss; resolving module path");

      const dummy_file_path = path.join(this.state.project.source_dir, "dummy.ts");
      const { resolvedModule: resolved_module } = ts.resolveModuleName(
        module,
        dummy_file_path,
        compiler_options,
        ts.sys,
      );

      if (!resolved_module) {
        Cache.module_resolution.set(module, false);
        return;
      }

      const resolved_path = fs.realpathSync(path.join(resolved_module.resolvedFileName, "../"));
      Cache.module_resolution.set(module, resolved_path);

      Logger.debug("found resolved module path");
      Logger.debugValue("resolved_path", path.relative(process.cwd(), resolved_path));

      return resolved_path;
    });
    assert(
      module_path,
      `Failed to resolve module: ${module}! Did you forget to install this package?`,
    );
    return module_path;
  }

  private isTransformFile(file: ts.SourceFile) {
    return (
      isPathDescendantOf(file.fileName, this.module_dir) &&
      !isPathDescendantOf(file.fileName, path.join(this.module_dir, "node_modules"))
    );
  }
}

class FileSymbol {
  private symbol: ts.Symbol;

  public readonly instance: ModuleNamespaceSymbol;
  public readonly find_instance: ModuleNamespaceSymbol;
  public readonly wait_for_instance: ModuleNamespaceSymbol;

  public readonly instances: ModuleNamespaceSymbol;
  public readonly wait_for_instances: ModuleNamespaceSymbol;

  public constructor(private state: TransformState, public readonly file: ts.SourceFile) {
    const symbol = this.state.getSymbol(file);
    assert(symbol, `Could not get file symbol for ${file.fileName}`);
    this.symbol = symbol;

    this.instance = new ModuleNamespaceSymbol(this, "$instance");
    this.find_instance = new ModuleNamespaceSymbol(this, "$findInstance");
    this.wait_for_instance = new ModuleNamespaceSymbol(this, "$waitForInstance");
    this.instances = new ModuleNamespaceSymbol(this, "$instances");
    this.wait_for_instances = new ModuleNamespaceSymbol(this, "$waitForInstances");
  }

  public get(name: string) {
    const export_symbol = this.symbol.exports?.get(name as ts.__String);
    return export_symbol;
  }

  public expect(name: string) {
    const export_symbol = this.symbol.exports?.get(name as ts.__String);
    assert(export_symbol, `Could not get "${name}" from ${this.file.fileName}`);
    return export_symbol;
  }
}

// $instances related function handler
class ModuleNamespaceSymbol {
  public readonly namespace_symbol: ts.Symbol;
  public readonly call_symbol = this.file_symbol.expect(this.name);
  public readonly exact_call_symbol: ts.Symbol;

  public constructor(private readonly file_symbol: FileSymbol, private readonly name: string) {
    const symbol = file_symbol.expect(name);
    this.namespace_symbol = symbol;
    this.exact_call_symbol = this.expect("exact");
  }

  public expect(name: string) {
    const export_symbol = this.namespace_symbol.exports?.get(name as ts.__String);
    assert(
      export_symbol,
      `Could not get "${this.name}.${name}" from ${this.file_symbol.file.fileName}`,
    );
    return export_symbol;
  }
}
