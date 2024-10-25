import { f } from "@transform/factory";
import { CallMacroDefinition } from "../types";
import MacroUtil from "../util";
import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { assert } from "@shared/util/assert";
import ts from "typescript";
import { PACKAGE_NAME } from "@shared/constants";

export const WaitForInstanceMacro: CallMacroDefinition = {
    getSymbols(state) {
        const symbol = state.symbolProvider.module.$waitForInstance;
        return [symbol.callSymbol, symbol.exactCallSymbol];
    },

    transform(state, node, symbol, loadedSymbols) {
        const [firstArg, secondArg] = node.arguments;
        const firstTypeArg = node.typeArguments?.at(0);
        if (!f.is.string(firstArg)) Diagnostics.error(firstArg ?? node, "Expected string");
        if (secondArg && !f.is.number(secondArg))
            Diagnostics.error(secondArg ?? node, "Expected number");

        const [, exactCallSymbol] = loadedSymbols;
        const useItsExactPath = exactCallSymbol === symbol;

        const targetPath = MacroUtil.resolvePath(state, node, firstArg.text);
        const typeGuard = MacroUtil.roblox.validateInstanceType(state, firstTypeArg);
        const hasTimeout = secondArg !== undefined;

        Logger.value("args.exact", () => useItsExactPath);
        Logger.value(
            "args.typeGuard",
            () => typeGuard && state.tsTypeChecker.typeToString(typeGuard),
        );
        Logger.value("args.path", () => state.project.relativeFromDir(targetPath));
        Logger.value("args.hasTimeout", () => hasTimeout);

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
            "$waitForInstance",
        );
        Logger.value("target.rbxPath.relative(source)", targetRbxPath);

        let expr = MacroUtil.roblox.createRootPathExpr(targetRbxPath);
        for (const part of targetRbxPath) {
            if (typeof part === "string") {
                // Use chaining if timeout is enabled
                const base = hasTimeout
                    ? f.field.optional(expr, f.identifier("WaitForChild"), false)
                    : f.field(expr, f.identifier("WaitForChild", false));

                const args: ts.Expression[] = [f.string(part)];
                if (secondArg !== undefined) args.push(secondArg);
                expr = f.call.chain(base, undefined, undefined, args);
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

            if (hasTimeout) {
                assert(property.length > 0, `unimplemented property for "${String(part)}"`);
                expr = f.field.optional(expr, f.identifier(property, false));
                continue;
            }

            // Since not every `.Parent` or other related fields is guaranteed to be
            // loaded, we need to wait these fields to be exists before proceeding to find
            // another succeeding path parts.
            Diagnostics.error(
                firstArg,
                `${PACKAGE_NAME} does not support with the use of '.WaitForChild(...)' with '${property}' property`,
            );
        }

        // make a temporary variable to signify the user that finding specific
        // instance logic was made from rbxts-transformer-fs using `MacroUtil.commentNodes`
        const tempVar = f.identifier("_temp_instance", true);
        const declareStmt = f.stmt.declareVariable(tempVar, true, undefined, expr);
        state.prereq(declareStmt);

        const displayPath = MacroUtil.fixPath(state.project.relativeFromDir(targetPath));
        let lastStmt: ts.Statement = declareStmt;

        // TODO: Apply WaitForChild in all properties if type guard is present
        //
        // Custom guard if first type argument is defined
        if (typeGuard) {
            const guard = MacroUtil.guard.prereqFromType(
                state,
                tempVar,
                firstTypeArg!,
                typeGuard,
                targetPath,
                false,
            );

            const assertVar = f.identifier("assert");
            const assertArgs: ts.Expression[] = [
                f.call(guard, undefined, [tempVar], false),
                f.string("Cannot find instance specified"),
            ];

            lastStmt = f.call(assertVar, undefined, assertArgs, true);
            state.prereq(lastStmt);
        }

        MacroUtil.commentNodes(
            state,
            declareStmt,
            lastStmt,
            `$waitForInstance: ${displayPath}`,
            true,
        );
        return tempVar;
    },
};
