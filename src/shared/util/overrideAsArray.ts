export function overrideAsArray<T>(
  value: NonNullable<T> | NonNullable<T>[] | undefined,
): NonNullable<T>[] {
  return Array.isArray(value) ? value : value == undefined ? [] : [value];
}
