import { f } from "@transform/factory";
import { CallMacroDefinition } from "../types";
import MacroUtil from "../util";
import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { assert } from "@shared/util/assert";
import ts from "typescript";

export const FindInstanceMacro: CallMacroDefinition = {
    getSymbols(state) {
        const symbol = state.symbolProvider.module.$findInstance;
        return [symbol.callSymbol, symbol.exactCallSymbol];
    },

    transform(state, node, symbol, loadedSymbols) {
        const [firstArg] = node.arguments;
        const firstTypeArg = node.typeArguments?.at(0);
        if (!f.is.string(firstArg)) Diagnostics.error(firstArg ?? node, "Expected string");

        const [, exactCallSymbol] = loadedSymbols;
        const useItsExactPath = exactCallSymbol === symbol;

        const targetPath = MacroUtil.resolvePath(state, node, firstArg.text);
        const typeGuard = MacroUtil.roblox.validateInstanceType(state, firstTypeArg);

        Logger.value("args.exact", () => useItsExactPath);
        Logger.value(
            "args.typeGuard",
            () => typeGuard && state.tsTypeChecker.typeToString(typeGuard),
        );
        Logger.value("args.path", () => state.project.relativeFromDir(targetPath));

        const { source, target } = MacroUtil.roblox.getRobloxPathOfTargetPath(
            state,
            targetPath,
            firstArg,
        );

        const targetRbxPath = MacroUtil.roblox.getRelativeRbxPathToTarget(
            source,
            target,
            useItsExactPath,
            firstArg,
            "$findInstance",
        );
        Logger.value("target.rbxPath.relative(source)", targetRbxPath);

        let expr = MacroUtil.roblox.createRootPathExpr(targetRbxPath);
        for (const part of targetRbxPath) {
            if (typeof part === "string") {
                expr = f.call.chain(
                    f.field.optional(expr, f.identifier("FindFirstChild"), false),
                    undefined,
                    undefined,
                    [f.string(part)],
                );
                continue;
            }
            let property = "";
            if (part === MacroUtil.roblox.RbxPathLocalPlayer) {
                property = "LocalPlayer";
            } else if (part === MacroUtil.roblox.RbxPathCharacter) {
                property = "Character";
            } else if (part === MacroUtil.roblox.RbxPathParent) {
                property = "Parent";
            }
            assert(property.length > 0, `unimplemented property for "${String(part)}"`);
            expr = f.field.optional(expr, f.identifier(property, false));
        }

        // make a temporary variable to signify the user that finding specific
        // instance logic was made from rbxts-transformer-fs using `MacroUtil.commentNodes`
        const tempVar = f.identifier("_temp_instance", true);
        let declareType = undefined;

        if (firstTypeArg !== undefined) {
            declareType = f.type.union(firstTypeArg, f.type.reference("undefined"));
            expr = f.as(f.as(expr, f.type.reference("unknown")), declareType);
        }

        const declareStmt = f.stmt.declareVariable(tempVar, false, declareType, expr);
        state.prereq(declareStmt);

        const displayPath = MacroUtil.fixPath(state.project.relativeFromDir(targetPath));
        let lastStmt: ts.Statement = declareStmt;

        // Custom guard if first type argument is defined
        if (typeGuard) {
            const guard = MacroUtil.guard.prereqFromType(
                state,
                tempVar,
                firstTypeArg!,
                typeGuard,
                targetPath,
                true,
            );

            // if guard isn't passed, it defaults back to nil
            lastStmt = f.stmt.ifStmt(f.not(f.call(guard, undefined, [tempVar])), [
                f.binary(tempVar, ts.SyntaxKind.EqualsToken, f.nil(), true),
            ]);
            state.prereq(lastStmt);
        }

        MacroUtil.commentNodes(state, declareStmt, lastStmt, `$findInstance: ${displayPath}`);
        return tempVar;
    },
};
