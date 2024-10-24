import { RbxPathParent } from "@roblox-ts/rojo-resolver";
import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { assert } from "@shared/util/assert";
import { f } from "@transform/factory";
import MacroIntrinsics from "../intrinsics";
import { CallMacroDefinition } from "../types";
import ts from "typescript";

export const FindInstanceMacro: CallMacroDefinition = {
    getSymbols(state) {
        const symbol = state.symbolProvider.module.$findInstance;
        return [symbol.callSymbol, symbol.exactCallSymbol];
    },

    transform(state, node, symbol, loadedSymbols) {
        const [firstArg] = node.arguments;
        const firstTypeArg = node.typeArguments && node.typeArguments.at(0);

        let customGuardType: ts.Type | undefined;
        if (firstTypeArg) {
            customGuardType = MacroIntrinsics.roblox.resolveInstanceTypeArgument(
                state,
                firstTypeArg,
            );
        }

        if (!f.is.string(firstArg)) Diagnostics.error(firstArg ?? node, "Expected string");

        const resolvedPath = MacroIntrinsics.resolvePath(state, node, firstArg.text);
        Logger.value(
            "args.guard",
            () => customGuardType && state.tsTypeChecker.typeToString(customGuardType),
        );
        Logger.value("args.path", () => state.project.relativeFromDir(resolvedPath));

        const [, exactCallSymbol] = loadedSymbols;

        const useItsExactPath = exactCallSymbol === symbol;
        const targetRbxPath = MacroIntrinsics.roblox.resolveTargetRbxPath(
            state,
            symbol.name,
            node,
            resolvedPath,
            useItsExactPath,
        );

        // Implementing $findInstance is actually easy, we can just spam with
        // FindFirstChild (unless it is not applicable to use one)
        let expression = MacroIntrinsics.roblox.createBaseReferenceExpr(targetRbxPath);
        for (const part of targetRbxPath.slice(1)) {
            assert(part !== MacroIntrinsics.roblox.ScriptMarker);
            if (part === RbxPathParent) {
                expression = f.field.optional(expression, f.identifier("Parent"), false);
                continue;
            }
            expression = f.call.chain(
                f.field.optional(expression, f.identifier("FindFirstChild"), false),
                undefined,
                undefined,
                [f.string(part)],
            );
        }

        // Custom guard if first type argument is defined
        if (customGuardType) {
            assert(firstTypeArg !== undefined);
            return MacroIntrinsics.guard.prereqFromType(
                state,
                expression,
                firstTypeArg,
                customGuardType,
                MacroIntrinsics.fixPath(state.project.relativeFromDir(resolvedPath)),
                true,
            );
        }

        return expression;
    },
};
