import { PACKAGE_NAME } from "core/constants";
import path from "path";
import ts from "typescript";
import { TransformState } from "./TransformState";
import { CacheStorage } from "./CacheStorage";
import { assert } from "utils/functions/assert";
import { isPathDescendantOf } from "utils/functions/isPathDescendantOf";
import { Logger } from "core/classes/Logger";

class FileSymbol {
  symbol: ts.Symbol;

  constructor(private state: TransformState, public readonly file: ts.SourceFile) {
    const symbol = this.state.getSymbol(file, true);
    assert(symbol, `failed to get file symbol for ${path.relative(state.project.path, file.fileName)}`);
    this.symbol = symbol;
  }

  getFromExports(name: string) {
    const exportSymbol = this.symbol.exports?.get(name as ts.__String);
    assert(exportSymbol, `export symbol for ${name} not found`);
    return exportSymbol;
  }
}

export class SymbolProvider {
  private moduleDir: string;

  private moduleDevTestDir: string;
  private moduleDevNodeModulesDir: string;

  public moduleFile?: FileSymbol;

  constructor(private state: TransformState) {
    const moduleDir = CacheStorage.resolveModuleDir(PACKAGE_NAME, this.state);
    assert(moduleDir, `Failed to resolve module ${PACKAGE_NAME}`);

    this.moduleDir = moduleDir;
    this.moduleDevTestDir = path.join(moduleDir, "test");
    this.moduleDevNodeModulesDir = path.join(moduleDir, "node_modules");

    this.lookupActiveFiles();
  }

  getModuleFileOrThrow() {
    assert(this.moduleFile, "Module file is not referenced");
    return this.moduleFile;
  }

  isModuleReferenced() {
    return this.moduleFile !== undefined;
  }

  private isModuleFile(file: ts.SourceFile) {
    // memothelemo: bug fix from my dev environment in rbxts-transformer-fs
    return (
      isPathDescendantOf(file.fileName, this.moduleDir) &&
      !isPathDescendantOf(file.fileName, this.moduleDevTestDir) &&
      !isPathDescendantOf(file.fileName, this.moduleDevNodeModulesDir)
    );
  }

  private lookupActiveFiles() {
    for (const file of this.state.program.getSourceFiles()) {
      if (this.isModuleFile(file)) {
        Logger.debug(`Module file is referenced, path = ${path.relative(this.state.project.path, file.fileName)}`);
        this.moduleFile = new FileSymbol(this.state, file);
      }
    }
  }
}
