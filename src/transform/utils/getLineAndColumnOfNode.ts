import ts from "typescript";

export function getLineAndColumnOfNode(node: ts.Node) {
  const file = node.getSourceFile();
  const linePos = file.getLineAndCharacterOfPosition(node.getStart());
  return [linePos.line + 1, linePos.character + 1] as const;
}
