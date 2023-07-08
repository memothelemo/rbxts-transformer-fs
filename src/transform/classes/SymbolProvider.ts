import path from "path";
import { TransformState } from "./TransformState";
import { PACKAGE_NAME } from "shared/constants";
import { CacheService } from "shared/services/CacheService";
import { Logger } from "shared/services/Logger";
import { assert } from "shared/utils/assert";
import { isPathDescendantOf } from "shared/utils/isPathDescendantOf";
import ts from "typescript";

class FileSymbol {
  public symbol: ts.Symbol;

  public constructor(private state: TransformState, public readonly file: ts.SourceFile) {
    const symbol = state.getSymbol(file, true);
    assert(symbol, `Failed to get symbol for ${state.project.relativeTo(file.fileName)}`);

    this.symbol = symbol;
  }

  public getFromExport(name: string) {
    const symbol = this.symbol.exports?.get(name as ts.__String);
    assert(symbol, `Failed to get export symbol for ${name} in ${this.state.project.relativeTo(this.file.fileName)}`);
    return symbol;
  }
}

export class SymbolProvider {
  private moduleDir: string;
  private typesDir: string;

  private _moduleFile?: FileSymbol;

  public constructor(public state: TransformState) {
    // Transformer module
    this.moduleDir = this.resolveModuleDirOrThrow(PACKAGE_NAME);
    this.typesDir = this.resolveModuleDirOrThrow("@rbxts/types");

    this.lookupActiveFiles();
  }

  public isModuleFileLoaded() {
    return this._moduleFile !== undefined;
  }

  public get moduleFile() {
    assert(this._moduleFile, "Module file is not loaded");
    return this._moduleFile;
  }

  private lookupActiveFiles() {
    for (const file of this.state.program.getSourceFiles()) {
      if (this.isModuleFile(file)) {
        Logger.debug(`Module file is being referenced, path = ${this.state.project.relativeTo(file.fileName)}`);
        if (this._moduleFile) {
          const path = this.state.project.relativeTo(this._moduleFile.file.fileName);
          const message = `Module file is already initialized, lastFile.path = ${path}`;
          assert(false, message);
        }
        this._moduleFile = new FileSymbol(this.state, file);
      }
    }

    if (!this._moduleFile) {
      Logger.debug("Module file is not referenced");
    }
  }

  private resolveModuleDirOrThrow(name: string) {
    const directory = CacheService.resolveModuleDir(name, this.state.project.sourceDir, this.state.compilerOptions);
    assert(directory, `Failed to resolve module: ${name}. Do you forget to install this package?`);
    return directory;
  }

  private isModuleFile(file: ts.SourceFile) {
    // bug fix from the dev environment in rbxts-transformer-fs
    return (
      isPathDescendantOf(file.fileName, this.moduleDir) &&
      !isPathDescendantOf(file.fileName, path.join(this.moduleDir, "test")) &&
      !isPathDescendantOf(file.fileName, path.join(this.moduleDir, "node_modules"))
    );
  }
}
