import { WarnLogger } from "../constants";

export function warn(text: string) {
	WarnLogger.writeLine(text);
}
