/** The exact counts' definitions compiled over BigInts ahead of time; see scripts/compile-exact.ts. */
export declare const EXACT_COMPILED: Readonly<
  Record<string, { readonly hash: string; readonly run: (sys: unknown, vars: Record<string, unknown>) => unknown }>
>;
