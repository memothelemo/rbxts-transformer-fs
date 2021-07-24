import kleur from "kleur";
import { PACKAGE_CONFIG } from "../constants";

export class AssertError {
	constructor(public condition: unknown, public text: string) {}

	public toString() {
		return `${kleur.bgRed("ASSERT ERROR")}: ${
			this.text
		}\nThis error is from: ${PACKAGE_CONFIG.name}`;
	}
}

export function assert(
	condition: unknown,
	text = "Assertion failed!",
): asserts condition {
	if (condition == null || condition === false) {
		throw new AssertError(condition, text).toString();
	}
}
