import ts from "typescript";

export type VariableLikeExpression = ts.PropertyAccessExpression | ts.ElementAccessExpression | ts.Identifier;
