import ts from "typescript";

/**
 * Simplified factory methods
 */
export namespace factory {
  let f = ts.factory;

  // export function nonnull(expression: ts.Expression) {
  //   return f.createNonNullExpression(expression);
  // }

  // export function optionalAccess(
  //   name: ts.Expression,
  //   property: ts.Expression | ts.PropertyName | ts.MemberName | string,
  // ): ts.Expression {
  //   if (typeof property === "string") {
  //     return f.createElementAccessChain(name, f.createToken(ts.SyntaxKind.QuestionDotToken), string(property));
  //   }

  //   if (ts.isComputedPropertyName(property)) {
  //     return optionalAccess(name, property.expression);
  //   }

  //   if (ts.isMemberName(property)) {
  //     return f.createPropertyAccessChain(name, f.createToken(ts.SyntaxKind.QuestionDotToken), property);
  //   }

  //   return f.createElementAccessChain(name, f.createToken(ts.SyntaxKind.QuestionDotToken), property);
  // }

  // export function negate(expression: ts.Expression) {
  //   return f.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, expression);
  // }

  // export function binary(left: ts.Expression, operator: ts.BinaryOperator, right: ts.Expression) {
  //   return f.createBinaryExpression(left, operator, right);
  // }

  // export function ifStmt(condition: ts.Expression, thenStatement: ts.Statement, elseStatement?: ts.Statement) {
  //   return f.createIfStatement(condition, thenStatement, elseStatement);
  // }

  // export function block(stmts: ts.Statement[], multiLine = true) {
  //   return f.createBlock(stmts, multiLine);
  // }

  // export function declareVariable(
  //   name: string | ts.BindingName,
  //   initializer?: ts.Expression,
  //   type?: ts.TypeNode,
  //   mutable = false,
  // ) {
  //   return f.createVariableStatement(
  //     undefined,
  //     f.createVariableDeclarationList(
  //       [f.createVariableDeclaration(name, undefined, type, initializer)],
  //       mutable ? ts.NodeFlags.Let : ts.NodeFlags.Const,
  //     ),
  //   );
  // }

  // export function callStmt(expression: ts.Expression, typeArguments?: ts.TypeNode[], args?: ts.Expression[]) {
  //   return f.createExpressionStatement(f.createCallExpression(expression, typeArguments, args));
  // }

  // export function call(expression: ts.Expression, typeArguments?: ts.TypeNode[], args?: ts.Expression[]) {
  //   return f.createCallExpression(expression, typeArguments, args);
  // }

  // export function accessChain(
  //   name: ts.Expression,
  //   ...indexes: (ts.Expression | ts.PropertyName | ts.MemberName | string)[]
  // ) {
  //   if (indexes.length === 0) return name;
  //   indexes = indexes.reverse();

  //   let result = access(name, indexes.pop()!);
  //   for (const index of indexes) {
  //     result = access(result, index);
  //   }

  //   return result;
  // }

  // export function access(
  //   name: ts.Expression,
  //   property: ts.Expression | ts.PropertyName | ts.MemberName | string,
  // ): ts.Expression {
  //   if (typeof property === "string") {
  //     return f.createElementAccessExpression(name, string(property));
  //   }

  //   if (ts.isComputedPropertyName(property)) {
  //     return access(name, property.expression);
  //   }

  //   if (ts.isMemberName(property)) {
  //     return f.createPropertyAccessExpression(name, property);
  //   }

  //   return f.createElementAccessExpression(name, property);
  // }

  export function string(value: string) {
    return f.createStringLiteral(value);
  }

  export function bool(value: boolean) {
    return value ? f.createTrue() : f.createFalse();
  }

  // export function array(values: ts.Expression[], multiLine = true) {
  //   return f.createArrayLiteralExpression(values, multiLine);
  // }

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
