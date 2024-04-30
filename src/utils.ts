import { NextOrObserver } from "./auth.types";

/**
 * Turns a base path and path segments into a single path for indexing Firebase documents
 * For example, joinPath('a', 'b', 'c') returns 'a/b/c'
 * @param path The base path
 * @param pathSegments The path segments to join
 * @returns The joined path
 */
export function joinPath(path: string, ...pathSegments: string[]): string {
  return pathSegments
    .reduce((path, pathSegment) => {
      return `${path}/${pathSegment}`.replace(/\/{2,}/g, "/");
    }, path)
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "");
}

export function wrapNextOrObserver<T, W>(
  current: NextOrObserver<W | null>,
  wrapper: (t: T) => W
): NextOrObserver<T | null> {
  if (typeof current === "function") {
    return (user: T | null) =>
      user == null ? current(null) : current(wrapper(user));
  }
  return {
    next: (user) => {
      current.next(user ? wrapper(user) : null);
    },
    error: current.error,
    complete: current.complete,
  };
}

export function sanitiseObject(
  data: { [field: string]: unknown },
  sanitisingFunction: (field: string, value: unknown) => unknown
) {
  const sanitised: { [field: string]: unknown } = {};
  // sanitise data, performing Timestamp->Date conversion etc
  for (const [field, value] of Object.entries(data)) {
    sanitised[field] = sanitisingFunction(field, value);
  }
  return sanitised;
}
