import ts from "typescript";

export namespace f {
    let factory = ts.factory;

    export namespace stmt {
        export function declareVariable(
            name: string | ts.BindingName,
            constant = true,
            type?: ts.TypeNode,
            initializer?: ts.Expression,
        ) {
            const flags = constant ? ts.NodeFlags.Const : ts.NodeFlags.Let;
            return factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                    [factory.createVariableDeclaration(name, undefined, type, initializer)],
                    flags,
                ),
            );
        }

        export function importDeclaration(
            path: string | ts.StringLiteral,
            imports?: (ts.Identifier | [string | ts.Identifier, ts.Identifier])[],
            defaultImport?: ts.Identifier,
            typeOnly = false,
        ) {
            return factory.createImportDeclaration(
                undefined,
                factory.createImportClause(
                    typeOnly,
                    defaultImport,
                    imports
                        ? factory.createNamedImports(
                              imports.map(x => {
                                  if (Array.isArray(x)) {
                                      return factory.createImportSpecifier(
                                          false,
                                          typeof x[0] === "string" ? f.identifier(x[0]) : x[0],
                                          x[1],
                                      );
                                  } else {
                                      return factory.createImportSpecifier(false, undefined, x);
                                  }
                              }),
                          )
                        : undefined,
                ),
                toExpression(path),
            );
        }
    }

    export type ConvertableExpression =
        | string
        | number
        | ts.Expression
        | Array<ConvertableExpression>
        | boolean;

    export function toExpression(
        expression: ConvertableExpression,
        stringFn: (param: string) => ts.Expression = string,
    ): ts.Expression {
        if (typeof expression === "string") {
            return stringFn(expression);
        } else if (typeof expression === "number") {
            return number(expression);
        } else if (typeof expression === "boolean") {
            return bool(expression);
        } else if (Array.isArray(expression)) {
            return array(expression.map(x => toExpression(x)));
        } else {
            return expression;
        }
    }

    export function number(value: number | string, flags?: ts.TokenFlags) {
        return +value < 0
            ? factory.createPrefixUnaryExpression(
                  ts.SyntaxKind.MinusToken,
                  factory.createNumericLiteral(-value, flags),
              )
            : factory.createNumericLiteral(value, flags);
    }

    export namespace type {
        export function reference(name: string | ts.EntityName, args?: ts.TypeNode[]) {
            return factory.createTypeReferenceNode(name, args);
        }
    }

    export function as(value: ts.Expression, type: ts.TypeNode) {
        return factory.createAsExpression(value, type);
    }

    export function identity(value: ts.Expression, type: ts.TypeNode) {
        return call(identifier("identity"), [type], [value], false);
    }

    export function nonnull(expression: ts.Expression) {
        return factory.createNonNullExpression(expression);
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
        if (asStatement) result = factory.createExpressionStatement(result);
        return result;
    }

    export namespace call {
        export function chain(
            expression: ts.Expression,
            optional?: boolean,
            typeArguments?: ts.TypeNode[],
            args?: ts.Expression[],
        ): ts.CallExpression;
        export function chain(
            expression: ts.Expression,
            optional?: boolean,
            typeArguments?: ts.TypeNode[],
            args?: ts.Expression[],
            asStatement?: false,
        ): ts.CallExpression;
        export function chain(
            expression: ts.Expression,
            optional?: boolean,
            typeArguments?: ts.TypeNode[],
            args?: ts.Expression[],
            asStatement?: true,
        ): ts.ExpressionStatement;
        export function chain(
            expression: ts.Expression,
            optional?: boolean,
            typeArguments?: ts.TypeNode[],
            args?: ts.Expression[],
            asStatement?: boolean,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ): any {
            let questionDot = undefined;
            if (optional) questionDot = factory.createToken(ts.SyntaxKind.QuestionDotToken);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let result: any = factory.createCallChain(expression, questionDot, typeArguments, args);
            if (asStatement) result = factory.createExpressionStatement(result);
            return result;
        }
    }

    export function override(newFactory: ts.NodeFactory) {
        factory = newFactory;
    }

    export function array(values: ts.Expression[], multiLine = true) {
        return factory.createArrayLiteralExpression(values, multiLine);
    }

    export function field(
        name: ts.Expression | string,
        property: ts.Expression | ts.PropertyName | ts.MemberName | string,
        expression = false,
    ): ts.ElementAccessExpression | ts.PropertyAccessExpression {
        if (typeof property === "string") {
            return factory.createElementAccessExpression(
                toExpression(name, identifier),
                string(property),
            );
        }

        if (ts.isComputedPropertyName(property)) {
            return field(name, property.expression);
        }

        if (ts.isMemberName(property) && !expression) {
            return factory.createPropertyAccessExpression(toExpression(name, identifier), property);
        } else {
            return factory.createElementAccessExpression(
                toExpression(name, identifier),
                toExpression(property),
            );
        }
    }

    export function object(
        properties:
            | readonly ts.ObjectLiteralElementLike[]
            | { [key: string]: ConvertableExpression | Array<ConvertableExpression> },
        multiLine = true,
    ) {
        if (properties instanceof Array) {
            return factory.createObjectLiteralExpression(properties, multiLine);
        } else {
            const realProperties: ts.ObjectLiteralElementLike[] = [];
            for (const key of Object.keys(properties)) {
                realProperties.push(propertyAssignmentDeclaration(key, properties[key]));
            }
            return factory.createObjectLiteralExpression(realProperties, multiLine);
        }
    }

    export function propertyAssignmentDeclaration(
        name: ts.PropertyName | string,
        value: ConvertableExpression,
    ) {
        return factory.createPropertyAssignment(
            typeof name === "string" ? string(name) : name,
            toExpression(value),
        );
    }

    export namespace field {
        export function optional(
            name: ts.Expression | string,
            property: ts.Expression | ts.PropertyName | ts.MemberName | string,
            expression = false,
        ): ts.ElementAccessChain | ts.PropertyAccessChain {
            if (typeof property === "string") {
                return factory.createElementAccessChain(
                    toExpression(name, identifier),
                    factory.createToken(ts.SyntaxKind.QuestionDotToken),
                    string(property),
                );
            }

            if (ts.isComputedPropertyName(property)) {
                return optional(name, property.expression);
            }

            if (ts.isMemberName(property) && !expression) {
                return factory.createPropertyAccessChain(
                    toExpression(name, identifier),
                    factory.createToken(ts.SyntaxKind.QuestionDotToken),
                    property,
                );
            } else {
                return factory.createElementAccessChain(
                    toExpression(name, identifier),
                    factory.createToken(ts.SyntaxKind.QuestionDotToken),
                    toExpression(property),
                );
            }
        }
    }

    export namespace value {
        export function bool(expr: ts.BooleanLiteral): boolean {
            return expr.kind === ts.SyntaxKind.TrueKeyword;
        }

        export function string(expr: ts.StringLiteralLike): string {
            return ts.stripQuotes(expr.getText());
        }
    }

    export namespace is {
        export function bool(expr: ts.Expression): expr is ts.BooleanLiteral {
            return ts.isBooleanLiteral(expr);
        }

        export function enumDeclaration(stmt: ts.Node): stmt is ts.EnumDeclaration {
            return ts.isEnumDeclaration(stmt);
        }

        export function importDeclaration(stmt: ts.Statement): stmt is ts.ImportDeclaration {
            return ts.isImportDeclaration(stmt);
        }

        export function namedDeclaration(node: ts.Node): node is ts.NamedDeclaration {
            return ts.isNamedDeclaration(node);
        }

        export function importClause(node: ts.Node): node is ts.ImportClause {
            return ts.isImportClause(node);
        }

        export function namedImports(node: ts.Node): node is ts.NamedImports {
            return ts.isNamedImports(node);
        }

        export function number(expr: ts.Expression): expr is ts.NumericLiteral {
            return ts.isNumericLiteral(expr);
        }

        export function string(expr: ts.Expression): expr is ts.StringLiteralLike {
            return ts.isStringLiteralLike(expr);
        }
    }

    export namespace update {
        export function sourceFile(
            file: ts.SourceFile,
            statements: readonly ts.Statement[],
            isDeclarationFile = file.isDeclarationFile,
            referencedFiles = file.referencedFiles,
            typeReferences = file.typeReferenceDirectives,
            hasNoDefaultLib = file.hasNoDefaultLib,
            libReferences = file.libReferenceDirectives,
        ) {
            return factory.updateSourceFile(
                file,
                statements,
                isDeclarationFile,
                referencedFiles,
                typeReferences,
                hasNoDefaultLib,
                libReferences,
            );
        }
    }
}
