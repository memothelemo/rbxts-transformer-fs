import ts from "typescript";

/**
 * Simplified factory methods
 */
export namespace factory {
  let f = ts.factory;

  export function string(value: string) {
    return f.createStringLiteral(value);
  }

  export function bool(value: boolean) {
    return value ? f.createTrue() : f.createFalse();
  }

  export function identifier(name: string, unique = false) {
    return unique ? f.createUniqueName(name) : f.createIdentifier(name);
  }

  export function none() {
    return identifier("undefined");
  }

  export namespace update {
    export function sourceFile(file: ts.SourceFile, statements: readonly ts.Statement[]) {
      return f.updateSourceFile(file, statements);
    }
  }

  export function setFactory(newFactory: ts.NodeFactory) {
    f = newFactory;
  }
}
