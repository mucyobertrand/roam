/** Joins class names, skipping falsy entries. Callers' classes go last. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
