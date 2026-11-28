// Re-judge every stored Sage and Wolfram answer against its pinned `expected`, with no kernel.
//
// The records keep each system's printed `out`; the scan judges the kernel's own `value`
// (Wolfram's FullForm) and `numeric` form, which are not stored. So the stored `out` is read as
// the answer, and a row whose `out` cannot be read that way (an InputForm infix such as `a/b`)
// keeps no recomputed verdict. What the script is for is a change of comparer: run it before
// (`--write before.json`) and after (`--baseline before.json`) and it names the rows whose
// recomputed verdict moved, so no agreeing row flips unnoticed.
//
//   node packages/reference/scripts/oracle-recompare.ts [--write out.json] [--baseline in.json] [--system wolfram,sage]

import { readFileSync, writeFileSync } from "node:fs";
import { referenceData } from "../src/node.ts";
import { asksForDigits } from "./oracle-verdict.ts";
import { cappedVerdicts } from "./oracle-verdict-capped.ts";

const args = process.argv.slice(2);
const after = (flag: string): string | undefined => {
  const at = args.indexOf(flag);
  return at < 0 ? undefined : args[at + 1];
};
const systems = (after("--system") ?? "wolfram,sage").split(",");
const baseline =
  after("--baseline") === undefined
    ? undefined
    : (JSON.parse(readFileSync(after("--baseline") as string, "utf8")) as Record<string, string>);

const verdicts = cappedVerdicts();
const recomputed: Record<string, string> = {};
const stored: Record<string, string> = {};
for (const head of referenceData().heads) {
  for (const example of head.entry.examples) {
    for (const system of systems) {
      const row = head.implementations?.[example.id]?.[system];
      if (row === undefined || row.out === undefined || row.out === "" || row.skip === true) continue;
      if (row.verdict === "error") continue;
      const id = `${system}:${head.head}/${example.id}`;
      // An agreeing row stores no verdict.
      stored[id] = row.verdict ?? "agree";
      const judged = await verdicts.verdict(
        system as never,
        example.expected as never,
        { value: row.out, ...(row.shown === undefined ? {} : { shown: row.shown }) },
        row.tolerance,
        asksForDigits(example.expr as never),
        example.expr as never,
        example.known as never,
      );
      recomputed[id] = judged;
    }
  }
}
verdicts.close();

const count = (map: Record<string, string>): string => {
  const tally = new Map<string, number>();
  for (const verdict of Object.values(map)) tally.set(verdict, (tally.get(verdict) ?? 0) + 1);
  return [...tally].map(([verdict, n]) => `${verdict} ${n}`).join(", ");
};
console.log(`rows re-judged: ${Object.keys(recomputed).length}`);
console.log(`stored:     ${count(stored)}`);
console.log(`recomputed: ${count(recomputed)}`);
const offStored = Object.keys(recomputed).filter((id) => recomputed[id] !== stored[id]);
console.log(
  `recomputed differs from stored (the kernel's FullForm and numeric form are not kept): ${offStored.length}`,
);

if (baseline !== undefined) {
  const moved = Object.keys(recomputed).filter((id) => baseline[id] !== undefined && baseline[id] !== recomputed[id]);
  console.log(`\nverdict moved against the baseline: ${moved.length}`);
  for (const id of moved) console.log(`  ${id}  ${baseline[id]} -> ${recomputed[id]}  (stored ${stored[id]})`);
  const flipped = moved.filter((id) => baseline[id] === "agree");
  console.log(`of which an agreeing row stopped agreeing: ${flipped.length}`);
}
const out = after("--write");
if (out !== undefined) writeFileSync(out, `${JSON.stringify(recomputed, null, 1)}\n`);
