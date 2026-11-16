/** Narrows an unknown value to one of a fixed list, without a cast at each call site. */
export function isOneOf<const T extends string>(options: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}
