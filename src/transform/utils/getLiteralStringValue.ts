import { TransformState } from "transform/classes/TransformState";
import ts from "typescript";
import { assert } from "utils/functions/assert";

export function getLiteralStringValue(state: TransformState, expr: ts.Expression): string | undefined {
  // Option A: Getting from the actual expression
  if (ts.isStringLiteralLike(expr)) {
    return ts.stripQuotes(expr.getText());
  }

  // Option B: Getting it from the type
  const type = state.getType(expr);
  if ((type.flags & ts.TypeFlags.StringLiteral) !== 0) {
    const value = (type as ts.StringLiteralType).value;
    assert(value, "failed to get string value");

    return value;
  }
}
