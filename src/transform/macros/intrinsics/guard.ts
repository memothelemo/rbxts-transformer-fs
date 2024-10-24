// Copied from: https://github.com/rbxts-flamework/transformer/blob/master/src/util/functions/buildGuardFromType.ts#L78
//
// I'm too lazy to create a guard function from scratch
import { PACKAGE_NAME } from "@shared/constants";
import Diagnostics, { DiagnosticError } from "@shared/services/diagnostics";
import { f } from "@transform/factory";
import { State } from "@transform/state";
import assert from "assert";
import ts from "typescript";

export function prereqFromType(
    state: State,
    expression: ts.Expression,
    diagnosticNode: ts.Node,
    type: ts.Type,
    sourcePath: string,
): ts.Identifier {
    const result = f.identifier("_instance", true);

    const declaration = f.stmt.declareVariable(result, true, undefined, expression);
    state.commentNode(declaration, ` ▼ rbxts-transformer-fs: getting ${sourcePath} ▼`);
    state.prereq(declaration);

    const guard = f.identifier("_guard", true);
    const guardDeclareStmt = f.stmt.declareVariable(
        guard,
        true,
        undefined,
        buildFromType(state, diagnosticNode, type),
    );
    state.prereq(guardDeclareStmt);

    // generating assert(_guard(<expr>), "Cannot find instance specified");
    const assertVar = f.identifier("assert");
    const assertArgs: ts.Expression[] = [
        f.call(guard, undefined, [result], false),
        f.string("Cannot find instance specified"),
    ];

    const lastStatement = f.call(assertVar, undefined, assertArgs, true);
    state.commentNode(lastStatement, ` ▲ rbxts-transformer-fs: getting ${sourcePath} ▲`);
    state.prereq(lastStatement);

    return result;
}

export function buildFromType(state: State, node: ts.Node, type: ts.Type) {
    const file = state.getSourceFileOfNode(node);
    const tracking = new Array<[ts.Node, ts.Type]>();

    return buildGuard(type);

    function fail(err: string): never {
        const basicDiagnostic = Diagnostics.createDiagnostic(
            node,
            ts.DiagnosticCategory.Error,
            err,
        );
        let previousType: ts.Type | undefined;
        for (const location of tracking) {
            if (location[1] === previousType) {
                continue;
            }

            previousType = location[1];
            ts.addRelatedInfo(
                basicDiagnostic,
                Diagnostics.createDiagnostic(
                    f.is.enumDeclaration(location[0]) ? location[0].name : location[0],
                    ts.DiagnosticCategory.Error,
                    `Type was defined here: ${state.tsTypeChecker.typeToString(location[1])}`,
                ),
            );
        }
        throw new DiagnosticError(basicDiagnostic);
    }

    function buildGuard(type: ts.Type): ts.Expression {
        const declaration = getDeclarationOfType(type);
        if (declaration) {
            tracking.push([declaration, type]);
        }

        const guard = buildGuardInner(type);
        if (declaration) {
            assert(tracking.pop()?.[0] === declaration, "Popped value was not expected");
        }

        return guard;
    }

    function buildGuardInner(type: ts.Type): ts.Expression {
        const typeChecker = state.tsTypeChecker;
        const tId = state.addFileImport(file, "@rbxts/t", "t");
        if (type.isUnion()) {
            return buildUnionGuard(type);
        }

        if (isInstanceType(type)) {
            const instanceType = getInstanceTypeFromType(file, type);
            const additionalGuards = new Array<ts.PropertyAssignment>();
            for (const property of type.getProperties()) {
                const propertyType = type.checker.getTypeOfPropertyOfType(type, property.name);
                if (propertyType && !instanceType.getProperty(property.name)) {
                    // assume intersections are children
                    additionalGuards.push(
                        f.propertyAssignmentDeclaration(property.name, buildGuard(propertyType)),
                    );
                }
            }

            const baseGuard = f.call(f.field(tId, "instanceIsA"), undefined, [
                f.toExpression(instanceType.symbol.name),
            ]);
            return additionalGuards.length === 0
                ? baseGuard
                : f.call(f.field(tId, "intersection"), undefined, [
                      baseGuard,
                      f.call(f.field(tId, "children"), undefined, [f.object(additionalGuards)]),
                  ]);
        }

        if (type.isIntersection()) {
            return buildIntersectionGuard(type);
        }

        if (isConditionalType(type)) {
            return f.call(f.field(tId, "union"), undefined, [
                buildGuard(type.resolvedTrueType!),
                buildGuard(type.resolvedFalseType!),
            ]);
        }

        if ((type.flags & ts.TypeFlags.TypeVariable) !== 0) {
            const constraint = type.checker.getBaseConstraintOfType(type);
            if (!constraint) fail("could not find constraint of type parameter");

            return buildGuard(constraint);
        }

        fail(`Cannot make an instance type guard of ${typeChecker.typeToString(type)}`);
    }

    function buildUnionGuard(type: ts.UnionType) {
        const tId = state.addFileImport(file, "@rbxts/t", "t");

        const simplifiedTypes = simplifyUnion(type);
        const [isOptional, types] = extractTypes(type.checker, simplifiedTypes);
        const guards = types.map(type => buildGuard(type));

        const union =
            guards.length > 1 ? f.call(f.field(tId, "union"), undefined, guards) : guards[0];

        if (!union) return f.field(tId, "none");
        return isOptional ? f.call(f.field(tId, "optional"), undefined, [union]) : union;
    }

    function buildIntersectionGuard(type: ts.IntersectionType) {
        const tId = state.addFileImport(file, "@rbxts/t", "t");

        if (type.checker.getIndexInfosOfType(type).length > 1) {
            fail(`${PACKAGE_NAME} cannot generate intersections with multiple index signatures.`);
        }

        // We find any disjoint types (strings, numbers, etc) as intersections with them are invalid.
        // Most intersections with disjoint types are used to introduce nominal fields.
        const disjointType = type.types.find(v => v.flags & ts.TypeFlags.DisjointDomains);
        if (disjointType) {
            return buildGuard(disjointType);
        }

        const guards = type.types.map(buildGuard);
        return f.call(f.field(tId, "intersection"), undefined, guards);
    }
}

function getInstanceTypeFromType(file: ts.SourceFile, type: ts.Type) {
    assert(
        type.getProperty("_nominal_Instance"),
        "non instance type was passed into getInstanceTypeFromType",
    );

    const diagnosticsLocation = getDeclarationOfType(type) ?? file;
    const nominalProperties = getNominalProperties(type);

    let specificType = type,
        specificTypeCount = 0;
    for (const property of nominalProperties) {
        const noNominalName = /_nominal_(.*)/.exec(property.name)?.[1];
        assert(noNominalName);

        const instanceSymbol = type.checker.resolveName(
            noNominalName,
            undefined,
            ts.SymbolFlags.Type,
            false,
        );
        if (!instanceSymbol) continue;

        const instanceDeclaration = instanceSymbol.declarations?.[0];
        if (!instanceDeclaration) continue;

        const instanceType = type.checker.getTypeAtLocation(instanceDeclaration);
        const subNominalProperties = getNominalProperties(instanceType);

        if (subNominalProperties.length > specificTypeCount) {
            specificType = instanceType;
            specificTypeCount = subNominalProperties.length;
        }
    }

    // intersection between two nominal types?
    for (const property of nominalProperties) {
        if (!specificType.getProperty(property.name)) {
            Diagnostics.error(
                diagnosticsLocation,
                `Intersection between nominal types is forbidden.`,
            );
        }
    }

    return specificType;
}

function getNominalProperties(type: ts.Type) {
    return type.getProperties().filter(x => x.name.startsWith("_nominal_"));
}

function getDeclarationOfType(type: ts.Type) {
    return type.symbol?.declarations?.[0];
}

function simplifyUnion(type: ts.UnionType) {
    const currentTypes = type.types;
    const types = new Array<ts.Type>();

    for (const type of currentTypes) {
        // We do not need to generate symbol types as they don't exist in Lua.
        if (type.flags & ts.TypeFlags.ESSymbolLike) {
            continue;
        }

        if (!type.symbol || !type.symbol.parent) {
            types.push(type);
            continue;
        }
    }

    return types;
}

function extractTypes(
    typeChecker: ts.TypeChecker,
    types: ts.Type[],
): [isOptional: boolean, types: ts.Type[]] {
    const undefinedtype = typeChecker.getUndefinedType();
    const voidType = typeChecker.getVoidType();

    return [
        types.some(type => type === undefinedtype || type === voidType),
        types.filter(type => type !== undefinedtype && type !== voidType),
    ];
}

function isInstanceType(type: ts.Type) {
    return type.getProperty("_nominal_Instance") !== undefined;
}

function isConditionalType(type: ts.Type): type is ts.ConditionalType {
    return (type.flags & ts.TypeFlags.Conditional) !== 0;
}
