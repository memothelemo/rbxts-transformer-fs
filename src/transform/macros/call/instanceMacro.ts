import { f } from "@transform/factory";
import { CallMacroDefinition } from "../types";
import MacroUtil from "../util";
import Diagnostics from "@shared/services/diagnostics";
import Logger from "@shared/services/logger";
import { assert } from "@shared/util/assert";
import ts from "typescript";
import { State } from "@transform/state";

function createCannotFindMessage(state: State, currentRef: ts.Expression, childOrProperty: string) {
    const ft = state.tsContext.factory;
    const span = ft.createTemplateSpan(
        f.call(f.field(currentRef, f.identifier("GetFullName", false)), undefined, []),
        ft.createTemplateTail(""),
    );
    return ft.createTemplateExpression(
        ft.createTemplateHead(`Cannot find \`${childOrProperty}\` in `),
        [span],
    );
}

export const InstanceMacro: CallMacroDefinition = {
    getSymbols(state) {
        const symbol = state.symbolProvider.module.$instance;
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
            "$instance",
        );
        Logger.value("target.rbxPath.relative(source)", targetRbxPath);

        /*
            Code Structure:
            // game.Players.LocalPlayer.PlayerScripts.World.This
            const _root = game.GetService("Players").LocalPlayer;
            const _path_2 = _path_1?.FindFirstChild("PlayerScripts");
            if (_path_2 === undefined) error(`Cannot find \`Hello\` at ${_root.GetFullName()}`);
            const _path_4 = _path_3?.FindFirstChild("World");
            assert(_path_4, `Cannot find \`World\` at ${_path_3.GetFullName()}`);
            const _path_5 = _path_4?.FindFirstChild("This");
            assert(_path_4, `Cannot find \`This\` at ${_path_4.GetFullName()}`);

            // If parent is undefined
            error("unexpected `Parent` is undefined")
        */

        const root = MacroUtil.roblox.createRootPathExpr(targetRbxPath);
        const rootVar = f.identifier("_root", true);

        const firstStmt = f.stmt.declareVariable(rootVar, true, undefined, root);
        state.prereq(firstStmt);

        let currentRef = rootVar;
        for (const [idx, part] of targetRbxPath.entries()) {
            const varName = f.identifier(`_path_${idx}`, true);
            let accessor: ts.Expression;
            let property = "";
            if (typeof part === "string") {
                accessor = f.call(
                    f.field(currentRef, f.identifier("FindFirstChild", false)),
                    undefined,
                    [f.string(part)],
                );
                property = part;
            } else {
                if (part === MacroUtil.roblox.RbxPathLocalPlayer) {
                    property = "LocalPlayer";
                } else if (part === MacroUtil.roblox.RbxPathCharacter) {
                    property = "Character";
                } else if (part === MacroUtil.roblox.RbxPathParent) {
                    property = "Parent";
                }
                assert(property.length > 0, `unimplemented property for "${String(part)}"`);
                accessor = f.field.optional(currentRef, f.identifier(property, false));
            }

            const message = createCannotFindMessage(state, currentRef, property);
            state.prereqList([
                f.stmt.declareVariable(varName, true, undefined, accessor),
                f.stmt.ifStmt(f.binary(varName, ts.SyntaxKind.EqualsEqualsEqualsToken, f.nil()), [
                    f.call(f.identifier("error"), undefined, [message], true),
                ]),
            ]);
            currentRef = varName;
        }

        // make a temporary variable to signify the user that finding specific
        // instance logic was made from rbxts-transformer-fs using `MacroUtil.commentNodes`
        const tempVar = f.identifier("_temp_instance", true);
        const declareStmt = f.stmt.declareVariable(tempVar, true, undefined, currentRef);
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
                false,
            );

            const assertVar = f.identifier("assert");
            const assertArgs: ts.Expression[] = [
                f.call(guard, undefined, [tempVar], false),
                f.string("This instance did not pass within a required type"),
            ];

            lastStmt = f.call(assertVar, undefined, assertArgs, true);
            state.prereq(lastStmt);
        }

        MacroUtil.commentNodes(state, firstStmt, lastStmt, `$instance: ${displayPath}`, false);
        return tempVar;
    },
};
