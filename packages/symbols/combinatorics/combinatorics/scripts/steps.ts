// The compile steps: each script and the one file it writes. build-generated.ts runs them and
// collect-verdicts.ts checks their rows.

export const compiles: ReadonlyArray<readonly [script: string, output: string]> = [
  ["scripts/compile-maps.ts", "src/compiled-maps.generated.js"],
  ["scripts/compile-families.ts", "collections/src/families/compiled-families.generated.js"],
  ["compositions/scripts/compile-definitions.ts", "compositions/src/statistics.compiled.generated.js"],
  ["lattice-paths/scripts/compile-definitions.ts", "lattice-paths/src/statistics.compiled.generated.js"],
  ["partitions/scripts/compile-definitions.ts", "partitions/src/statistics.compiled.generated.js"],
  ["permutations/scripts/compile-definitions.ts", "permutations/src/statistics.compiled.generated.js"],
  ["tableaux/scripts/compile-definitions.ts", "tableaux/src/statistics.compiled.generated.js"],
  ["trees/scripts/compile-definitions.ts", "trees/src/statistics.compiled.generated.js"],
  ["set-partitions/scripts/compile-definitions.ts", "set-partitions/src/statistics.compiled.generated.js"],
  ["words/scripts/compile-definitions.ts", "words/src/statistics.compiled.generated.js"],
  ["graphs/scripts/compile-definitions.ts", "graphs/src/statistics.compiled.generated.js"],
  ["cartan/scripts/compile-definitions.ts", "cartan/src/statistics.compiled.generated.js"],
];

/** The step names the snapshot's rows carry, by script (each script names its own: see its `compileArea`). */
export const STEP_NAMES: Readonly<Record<string, string>> = {
  "scripts/compile-maps.ts": "compile-maps",
  "scripts/compile-families.ts": "compile-families",
  ...Object.fromEntries(
    compiles
      .map(([script]) => script)
      .filter((script) => script.endsWith("/compile-definitions.ts"))
      .map((script) => [script, `compile-${script.split("/")[0]}`]),
  ),
};
