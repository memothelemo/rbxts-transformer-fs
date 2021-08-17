/** Wipes the entire members of an array */
export function wipeArray<T extends unknown>(array: T[]) {
	for (let i = 0; i < array.length; i++) {
		array.pop();
	}
}
