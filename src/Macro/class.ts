import ts from "byots";
import { assert } from "../Shared/functions/assert";
import { TransformState } from "../Transformer/state";
import { CALL_MACROS } from "./constants";

export function getCallSymbol(state: TransformState, name: string) {
	const symbol = state.typeChecker.resolveName(
		name,
		undefined,
		ts.SymbolFlags.Function,
		false,
	);
	return symbol;
}

export class Manager {
	private callMacros = new Map<ts.Symbol, string>();

	public constructor(state: TransformState) {
		/* Registering macros */
		for (const [value, name] of Object.entries(CALL_MACROS)) {
			const callSymbol = getCallSymbol(state, name);
			assert(
				callSymbol,
				`${name} is not supported in rbxts-transformer-path!`,
			);
			this.callMacros.set(callSymbol, value);
		}
	}

	public getCallMacros(symbol: ts.Symbol) {
		return this.callMacros.get(symbol);
	}
}
