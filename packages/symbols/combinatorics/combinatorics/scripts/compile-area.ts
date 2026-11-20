// What every area's `scripts/compile-definitions.ts` does: compile the area's statistics to
// JavaScript ahead of time, cross-checked against the interpreter (step 6b), the checks split
// across processes (shards.ts).

import { fileURLToPath } from "node:url";
import { type CompiledDefinition, renderCompiled } from "../src/statistics/generate-compiled.ts";
import { compiledDefinitionsInDomains } from "../src/statistics/generate-domain.ts";
import { type Definition, signatureOf } from "../src/statistics/types.ts";
import { smallElements } from "./samples.ts";
import { sharded } from "./shards.ts";
import { checkers } from "./verdicts.ts";
import { writeGenerated } from "./write-generated.ts";

const bySignature = (a: { signature: string }, b: { signature: string }): number =>
  a.signature < b.signature ? -1 : a.signature > b.signature ? 1 : 0;

/** Compiles `definitions` (over subjects of `shape`) into `output`, a path relative to `script`. */
export async function compileArea(
  script: string,
  step: string,
  definitions: readonly Definition[],
  shape: string,
  output: string,
  subjects = smallElements,
): Promise<void> {
  // An exact count compiles over BigInts (compile-exact.ts), never as doubles.
  const compiled = definitions.filter((d) => d.exact !== true);
  const run = await sharded(script, step, checkers.statistics, compiled.map(signatureOf), (verdicts, mine) =>
    compiledDefinitionsInDomains(compiled, shape, subjects, verdicts, mine),
  );
  if (run === undefined) return;
  const entries: CompiledDefinition[] = run.results.flatMap((r) => r.compiled).toSorted(bySignature);
  const disagreed = run.results.flatMap((r) => r.disagreed).toSorted();
  writeGenerated(fileURLToPath(new URL(output, script)), renderCompiled(entries));
  run.verdicts.save();
  console.log(`${entries.length} of ${compiled.length} definitions compiled`);
  for (const signature of disagreed)
    console.log(`${signature}: no fresh verdict that the compiled code agrees; left interpreted`);
}
