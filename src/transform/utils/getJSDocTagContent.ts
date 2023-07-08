import ts from "typescript";

export function getJSDocTagContent(node: ts.Node, tag: string): NonNullable<unknown> | void {
  const tags = ts.getJSDocTags(node);
  for (const { comment, tagName } of tags) {
    if (tagName.text === tag && comment != undefined) {
      return comment;
    }
  }
}
