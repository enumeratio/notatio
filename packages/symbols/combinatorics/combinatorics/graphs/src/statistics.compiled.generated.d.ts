/** Statistics' definitions compiled ahead of time; see scripts/compile-definitions.ts. */
export declare const COMPILED: Readonly<
  Record<
    string,
    {
      readonly hash: string;
      readonly infinite?: readonly ("PositiveInfinity" | "NegativeInfinity")[];
      readonly run: (sys: unknown, vars: Record<string, unknown>) => unknown;
    }
  >
>;
