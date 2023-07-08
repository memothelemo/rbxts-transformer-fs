export function benchmark<T>(callback: () => T): [T, string] {
  const now = Date.now();
  const result = callback();
  const elapsed = Date.now() - now;

  return [result, `${elapsed} ms`];
}
