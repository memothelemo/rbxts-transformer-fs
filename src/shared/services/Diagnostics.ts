import { PACKAGE_NAME } from "shared/constants";
import ts from "typescript";

function createDiagnosticAtLocation(
  node: ts.Node,
  messageText: string,
  category: ts.DiagnosticCategory,
  file = ts.getSourceFileOfNode(node),
): ts.DiagnosticWithLocation {
  return {
    category,
    file,
    messageText,
    start: node.getStart(),
    length: node.getWidth(),
    code: ` ${PACKAGE_NAME}` as never,
  };
}

export class DiagnosticError extends Error {
  constructor(public diagnostic: ts.DiagnosticWithLocation) {
    super(diagnostic.messageText as string);
  }
}

export class Diagnostics {
  private static waste = new Array<ts.DiagnosticWithLocation>();

  public static addDiagnostic(diagnostic: ts.DiagnosticWithLocation) {
    this.waste.push(diagnostic);
  }

  public static addDiagnostics(...diagnostics: ts.DiagnosticWithLocation[]) {
    this.waste.push(...diagnostics);
  }

  public static flush() {
    const current = this.waste;
    this.waste = [];

    return current;
  }

  public static hasErrors() {
    for (const diagnostic of this.waste) {
      if (diagnostic.category === ts.DiagnosticCategory.Error) {
        return true;
      }
    }
    return false;
  }

  public static createDiagnostic(node: ts.Node, category: ts.DiagnosticCategory, messages: string[]) {
    return createDiagnosticAtLocation(node, messages.join("\n"), category);
  }

  public static warn(node: ts.Node, ...messages: string[]) {
    this.waste.push(this.createDiagnostic(node, ts.DiagnosticCategory.Warning, messages));
  }

  public static error(node: ts.Node, ...messages: string[]): never {
    const diagnostic = this.createDiagnostic(node, ts.DiagnosticCategory.Error, messages);
    throw new DiagnosticError(diagnostic);
  }
}
