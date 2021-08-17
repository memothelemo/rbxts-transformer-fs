import { BaseError } from "../shared/errors/base";

export class TransformerError extends BaseError {
	readonly withHeader = true;

	constructor(public readonly message: string) {
		super();
	}

	public toString() {
		return this.message;
	}
}
