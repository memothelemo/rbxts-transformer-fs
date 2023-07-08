import ts from "typescript";

export namespace f {
  let factory = ts.factory;

  export namespace is {
    export function bool(expr: ts.Expression): expr is ts.BooleanLiteral {
      return ts.isBooleanLiteral(expr);
    }

    export function string(expr: ts.Expression): expr is ts.StringLiteralLike {
      return ts.isStringLiteralLike(expr);
    }
  }

  export namespace update {
    export function sourceFile(file: ts.SourceFile, statements: readonly ts.Statement[]) {
      return factory.updateSourceFile(file, statements);
    }
  }

  export function nonnull(expression: ts.Expression) {
    return factory.createNonNullExpression(expression);
  }

  type Accessor = ts.Expression | ts.PropertyName | ts.MemberName | string;

  export function call(
    expression: ts.Expression,
    typeArguments?: ts.TypeNode[],
    args?: ts.Expression[],
  ): ts.CallExpression;
  export function call(
    expression: ts.Expression,
    typeArguments?: ts.TypeNode[],
    args?: ts.Expression[],
    asStatement?: false,
  ): ts.CallExpression;
  export function call(
    expression: ts.Expression,
    typeArguments?: ts.TypeNode[],
    args?: ts.Expression[],
    asStatement?: true,
  ): ts.ExpressionStatement;
  export function call(
    expression: ts.Expression,
    typeArguments?: ts.TypeNode[],
    args?: ts.Expression[],
    asStatement?: boolean,
  ): ts.CallExpression | ts.ExpressionStatement {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = factory.createCallExpression(expression, typeArguments, args);
    if (asStatement) {
      result = factory.createExpressionStatement(result);
    }
    return result;
  }

  export function declareVariable(
    name: string | ts.BindingName,
    initializer?: ts.Expression,
    type?: ts.TypeNode,
    mutable = false,
  ) {
    return factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [factory.createVariableDeclaration(name, undefined, type, initializer)],
        mutable ? ts.NodeFlags.Let : ts.NodeFlags.Const,
      ),
    );
  }

  export function optionalIndex(name: ts.Expression, property: Accessor): ts.Expression {
    if (typeof property === "string") {
      return factory.createElementAccessChain(
        name,
        factory.createToken(ts.SyntaxKind.QuestionDotToken),
        string(property),
      );
    }

    if (ts.isComputedPropertyName(property)) {
      return optionalIndex(name, property.expression);
    }

    if (ts.isMemberName(property)) {
      return factory.createPropertyAccessChain(name, factory.createToken(ts.SyntaxKind.QuestionDotToken), property);
    }

    return factory.createElementAccessChain(name, factory.createToken(ts.SyntaxKind.QuestionDotToken), property);
  }

  export function index(name: ts.Expression, ...indexes: Accessor[]) {
    function _access(name: ts.Expression, property: Accessor): ts.Expression {
      if (typeof property === "string") {
        return factory.createElementAccessExpression(name, string(property));
      }

      if (ts.isComputedPropertyName(property)) {
        return index(name, property.expression);
      }

      if (ts.isMemberName(property)) {
        return factory.createPropertyAccessExpression(name, property);
      }

      return factory.createElementAccessExpression(name, property);
    }

    if (indexes.length === 0) return name;
    indexes = indexes.reverse();

    let result = _access(name, indexes.pop()!);
    for (const index of indexes) {
      result = _access(result, index);
    }

    return result;
  }

  export function string(value: string) {
    return factory.createStringLiteral(value);
  }

  export function bool(value: boolean) {
    return value ? factory.createTrue() : factory.createFalse();
  }

  export function identifier(name: string, unique = false) {
    return unique ? factory.createUniqueName(name) : factory.createIdentifier(name);
  }

  export function nil() {
    return identifier("undefined");
  }

  export function set(newFactory: ts.NodeFactory) {
    factory = newFactory;
  }
}
