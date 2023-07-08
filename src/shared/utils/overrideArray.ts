export function overrideArray<T>(object: T | ReadonlyArray<T>): T[] {
  return (Array.isArray(object) ? object : [object]) as never;
}
