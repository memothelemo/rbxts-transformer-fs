import { BaseError } from "../shared/errors/base";

/**
 * **TransformerError** is a strict error other than
 * DiagnosticError (_where it is on TypeScript to handle it_)
 *
 * If this thing throws up, the entire process (even roblox-ts watch program)
 * will seriously terminated
 */
export class TransformerError extends BaseError {
	readonly withHeader = true;

	constructor(public readonly message: string) {
		super();
	}

	public toString() {
		return this.message;
	}
}
