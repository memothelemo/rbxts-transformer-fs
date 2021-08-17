/* eslint-disable prettier/prettier */

/** Gets the value type of an Array */
type GetArrayType<T> =
	T extends Array<infer I>
		? I
		: never;
