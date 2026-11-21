// Measures the interpreter sweep (`interpreter-sweep.ts`) over every statistic and map definition and writes
// the committed list of rows the nightly test runs (`tests/fixtures/interpreter-sweep.tsv`): each
// (definition, subject) whose declared and bare interpreter both finished within a second, with what each took.
//
//   node packages/census/scripts/collect-interpreter-sweep.ts [--cap SECONDS] [--workers N] [--minutes N]
//     [--raw FILE] [--out FILE] [--only TEXT] [--report]
//
// Subjects of a definition are its reference examples that hold `expected` and a single literal subject of its
// carrier, then up to 14 of the carrier's small elements and up to 3 larger ones (`targetSubjects`). Every
// row's three calls (declared interpreter, bare interpreter, compiled) run under `--cap` (default 30 s); after
// two timeouts of one side on a definition, that side leaves the definition's remaining, heavier subjects.
//
// Everything measured goes to the raw file (JSON lines, `.scratch/interpreter-sweep-raw.jsonl`) as it
// happens, and a run resumes from it, so the work can go in chunks: `--minutes` stops taking new rows after
// that long (a `heavy` call is capped at an hour). With every definition done, the list is written and the report
// printed; `--report` prints the report of what the raw file holds and writes nothing.

import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { sweepTargets, type SweepTarget, weightOf } from "@notatio/combinatorics/sweep";
import { referenceData } from "@notatio/reference/node";
import {
  type ListedRow,
  type Outcome,
  type RowResult,
  WorkerSlot,
  classifyCompiled,
  classifyDeclared,
  familyOf,
  finished,
  openSlots,
  overSlots,
  SLICES,
  sliceOf,
  summarise,
  writeList,
} from "./interpreter-sweep.ts";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string): string => {
  const at = args.indexOf(name);
  return at < 0 ? fallback : (args[at + 1] ?? fallback);
};
const CAP_MS = Number(flag("--cap", "30")) * 1000;
const WORKERS = Number(flag("--workers", "3"));
const MINUTES = Number(flag("--minutes", "0"));
const RAW = flag("--raw", ".scratch/interpreter-sweep-raw.jsonl");
const OUT = flag("--out", new URL("../tests/fixtures/interpreter-sweep.tsv", import.meta.url).pathname);
const ONLY = flag("--only", "");
const REPORT_ONLY = args.includes("--report");

/** A row's two sides both finished within this long are kept in the list. */
const LIST_LIMIT_MS = 1000;
/** A side that times out this many times on a definition skips the definition's remaining subjects. */
const TIMEOUTS_BEFORE_SKIP = 2;
/** The time a worker has to generate a definition's subjects. */
const SUBJECTS_CAP_MS = 300_000;

type Source = "example" | "small" | "large";
interface Planned {
  readonly subject: unknown;
  readonly source: Source;
  readonly expected?: unknown;
}
type RawLine =
  | { plan: string; subjects: Planned[] }
  | ({ key: string; source: Source; expected?: unknown } & Pick<
      RowResult,
      "subject" | "declared" | "bare" | "compiled"
    >);

// ---- Examples ------------------------------------------------------------------------------------------

const LITERAL_HEADS = new Set(["List", "Tuple", "Negate", "Rational"]);
const isLiteral = (node: unknown): boolean =>
  typeof node === "number" ||
  typeof node === "string" ||
  (Array.isArray(node) && LITERAL_HEADS.has(node[0] as string) && node.slice(1).every(isLiteral));

/** The reference examples of a definition that hold `expected` and call it on one literal subject of its carrier:
 *  `Head(Carrier(contents))`, or `Head(contents)` for a statistic that also takes a bare list. */
function exampleSubjects(
  target: SweepTarget,
  byHead: ReadonlyMap<string, readonly { expr: unknown; expected?: unknown }[]>,
): Planned[] {
  const head = target.kind === "statistic" ? target.definition.head : target.map.name;
  const bare = target.kind === "statistic" && target.definition.alsoOnList === true;
  const found: Planned[] = [];
  for (const { expr, expected } of byHead.get(head) ?? []) {
    if (expected === undefined || !Array.isArray(expr) || expr.length !== 2 || expr[0] !== head) continue;
    const argument = expr[1] as unknown;
    const wrapped = Array.isArray(argument) && argument.length === 2 && argument[0] === target.carrier;
    const contents = wrapped ? (argument as unknown[])[1] : bare ? argument : undefined;
    if (contents !== undefined && isLiteral(contents)) found.push({ subject: contents, source: "example", expected });
  }
  return found;
}

/** Whether an answer is an example's `expected`, as written or inside its carrier's constructor. */
function matchesExpected(text: string, expected: unknown): boolean {
  if (text === JSON.stringify(expected)) return true;
  return Array.isArray(expected) && expected.length === 2 && text === JSON.stringify(expected[1]);
}

// ---- The raw file --------------------------------------------------------------------------------------

const plans = new Map<string, Planned[]>();
const rowsOf = new Map<string, (RawLine & { key: string })[]>();
if (existsSync(RAW)) {
  for (const line of readFileSync(RAW, "utf8").split("\n")) {
    if (line === "") continue;
    const parsed = JSON.parse(line) as RawLine;
    if ("plan" in parsed) plans.set(parsed.plan, parsed.subjects);
    else rowsOf.set(parsed.key, [...(rowsOf.get(parsed.key) ?? []), parsed]);
  }
}
const append = (line: RawLine): void => appendFileSync(RAW, `${JSON.stringify(line)}\n`);

// ---- Report --------------------------------------------------------------------------------------------

function report(targets: readonly SweepTarget[]): void {
  const all = targets.flatMap(
    (target) =>
      (rowsOf.get(target.key) ?? []) as (RawLine & { key: string; source: Source; expected?: unknown } & RowResult)[],
  );
  const summary = summarise(all);
  const table = (title: string, tally: Record<string, number>): void => {
    console.log(`\n${title}`);
    for (const [name, count] of Object.entries(tally).toSorted(([a], [b]) => (a < b ? -1 : 1)))
      console.log(`  ${name.padEnd(16)} ${count}`);
  };
  console.log(
    `rows: ${all.length} (${["example", "small", "large"].map((s) => `${s} ${all.filter((r) => r.source === s).length}`).join(", ")})`,
  );
  table("pass 1, declared against bare", summary.pass1);
  table("pass 2, declared interpreter against compiled", summary.pass2);

  console.log(
    "\nfamily\trows\tagree\tD-err\tD-wrong\tslow D\tslow both\tnot run\tright\tc-wrong\tc-error\tno compiled",
  );
  const families = new Map<string, typeof all>();
  for (const row of all) families.set(familyOf(row.key), [...(families.get(familyOf(row.key)) ?? []), row]);
  for (const [family, rows] of families) {
    const one = (name: string): number => rows.filter((r) => classifyDeclared(r) === name).length;
    const two = (name: string): number => rows.filter((r) => classifyCompiled(r) === name).length;
    console.log(
      [
        family,
        rows.length,
        one("agree"),
        one("declared-error"),
        one("declared-wrong"),
        one("slow-declared"),
        one("slow-both"),
        one("not-run"),
        two("right"),
        two("wrong"),
        two("error"),
        two("no-compiled"),
      ].join("\t"),
    );
  }

  const listed = all.filter(
    (r) => finished(r.declared) && finished(r.bare) && r.declared.ms <= LIST_LIMIT_MS && r.bare.ms <= LIST_LIMIT_MS,
  );
  const within = summarise(listed);
  console.log(
    `\nrows both sides finished within ${LIST_LIMIT_MS} ms: ${listed.length}; declared ${(within.declaredMs / 1000).toFixed(1)} s, bare ${(within.bareMs / 1000).toFixed(1)} s, declared/bare ${within.ratio.toFixed(3)}`,
  );
  console.log("slice\trows\tdeclared s\tbare s\tratio");
  for (let slice = 0; slice < SLICES; slice++) {
    const part = summarise(listed.filter((r) => sliceOf(r.key, r.subject) === slice));
    console.log(
      `${slice}\t${part.rows}\t${(part.declaredMs / 1000).toFixed(0)}\t${(part.bareMs / 1000).toFixed(0)}\t${part.ratio.toFixed(3)}`,
    );
  }
  console.log(
    `over every row both finished: declared ${(summary.declaredMs / 1000).toFixed(0)} s, bare ${(summary.bareMs / 1000).toFixed(0)} s, ratio ${summary.ratio.toFixed(3)}`,
  );

  // The slowdown the list cannot see: rows where either side took over 0.3 s (gxsweep measured 1.97x here before
  // `declareOperatorForms` kept compute-engine's signatures), and the definitions it is steepest on.
  const heavy = all.filter((r) => finished(r.declared) && finished(r.bare) && (r.declared.ms > 300 || r.bare.ms > 300));
  const heavySum = summarise(heavy);
  console.log(
    `\nrows where either side took over 300 ms: ${heavy.length}; declared ${(heavySum.declaredMs / 1000).toFixed(0)} s, bare ${(heavySum.bareMs / 1000).toFixed(0)} s, ratio ${heavySum.ratio.toFixed(3)}; over 1.5x: ${heavy.filter((r) => r.declared.ms > 1.5 * r.bare.ms).length}`,
  );
  const perDefinition = new Map<string, { declared: number; bare: number }>();
  for (const r of heavy) {
    const sums = perDefinition.get(r.key) ?? { declared: 0, bare: 0 };
    perDefinition.set(r.key, { declared: sums.declared + r.declared.ms, bare: sums.bare + r.bare.ms });
  }
  console.log("steepest definitions on those rows (declared s / bare s):");
  for (const [key, sums] of [...perDefinition]
    .toSorted((a, b) => b[1].declared / b[1].bare - a[1].declared / a[1].bare)
    .slice(0, 12))
    console.log(
      `  ${key} ${(sums.declared / 1000).toFixed(1)} / ${(sums.bare / 1000).toFixed(1)} = ${(sums.declared / sums.bare).toFixed(2)}x`,
    );

  const mismatched = all.filter(
    (r) => r.source === "example" && r.declared.kind === "answer" && !matchesExpected(r.declared.text!, r.expected),
  );
  console.log(
    `\nexample rows where the declared interpreter answered: ${all.filter((r) => r.source === "example" && r.declared.kind === "answer").length}; differing from expected: ${mismatched.length}`,
  );
  for (const r of mismatched)
    console.log(`  ${r.key} ${JSON.stringify(r.subject)}: ${r.declared.text} (expected ${JSON.stringify(r.expected)})`);

  console.log("\nrows that are not agree or right:");
  for (const row of all) {
    const one = classifyDeclared(row);
    const two = classifyCompiled(row);
    if (one !== "agree" && one !== "not-run" && !one.startsWith("slow"))
      console.log(`  pass 1 ${one}: ${row.key} ${JSON.stringify(row.subject)}`);
    if (!["right", "no-compiled", "not-run", "slow"].includes(two))
      console.log(`  pass 2 ${two}: ${row.key} ${JSON.stringify(row.subject)}`);
  }
  const died = all.filter((r) => [r.declared, r.bare, r.compiled].some((o) => o.kind === "died"));
  for (const r of died)
    console.log(
      `  died: ${r.key} ${JSON.stringify(r.subject)}: ${[r.declared, r.bare, r.compiled].find((o) => o.kind === "died")!.text}`,
    );
}

// ---- The run -------------------------------------------------------------------------------------------

const targets = sweepTargets().filter((target) => ONLY === "" || target.key.includes(ONLY));

if (REPORT_ONLY) {
  report(targets);
  process.exit(0);
}

const data = referenceData();
const byHead = new Map<string, { expr: unknown; expected?: unknown }[]>();
for (const { entry } of data.heads) byHead.set(entry.name, [...(byHead.get(entry.name) ?? []), ...entry.examples]);

const deadline = MINUTES > 0 ? Date.now() + MINUTES * 60_000 : Infinity;
const { slots, close } = openSlots(WORKERS);
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => void close().then(() => process.exit(1)));

/** Plans a definition's subjects once: its examples, then the generated ones, by weight, none twice. */
async function plan(slot: WorkerSlot, target: SweepTarget): Promise<Planned[] | undefined> {
  const held = plans.get(target.key);
  if (held !== undefined) return held;
  const generated = await slot.subjects(target.key, SUBJECTS_CAP_MS);
  if (generated === undefined) return undefined;
  const seen = new Set<string>();
  const planned: Planned[] = [];
  const add = (item: Planned): void => {
    const id = JSON.stringify(item.subject);
    if (seen.has(id)) return;
    seen.add(id);
    planned.push(item);
  };
  for (const item of exampleSubjects(target, byHead)) add(item);
  for (const subject of generated.small) add({ subject, source: "small" });
  for (const subject of generated.large) add({ subject, source: "large" });
  // By weight, so a side's heavier subjects are the ones it leaves after two timeouts.
  planned.sort((a, b) => weightOf(a.subject) - weightOf(b.subject));
  plans.set(target.key, planned);
  append({ plan: target.key, subjects: planned });
  return planned;
}

const skipped: Outcome = { kind: "skipped", ms: 0 };
let incomplete = 0;
let ran = 0;

await overSlots(slots, targets, async (target, slot) => {
  const done = rowsOf.get(target.key) ?? [];
  const planned = await plan(slot, target);
  if (planned === undefined) {
    console.error(`no subjects in time for ${target.key}`);
    incomplete++;
    return;
  }
  // The timeouts the rows already measured, per side, so a resumed definition skips as an unbroken one would.
  const timeouts = { declared: 0, bare: 0 };
  for (const row of done as unknown as RowResult[]) {
    if (row.declared.kind === "timeout") timeouts.declared++;
    if (row.bare.kind === "timeout") timeouts.bare++;
  }
  const have = new Set(done.map((row) => JSON.stringify((row as { subject: unknown }).subject)));
  for (const item of planned) {
    if (have.has(JSON.stringify(item.subject))) continue;
    if (Date.now() > deadline) {
      incomplete++;
      return;
    }
    const skipDeclared = timeouts.declared >= TIMEOUTS_BEFORE_SKIP;
    const skipBare = timeouts.bare >= TIMEOUTS_BEFORE_SKIP;
    let row: RowResult;
    if (skipDeclared && skipBare)
      row = { key: target.key, subject: item.subject, declared: skipped, bare: skipped, compiled: skipped };
    else {
      const declared = skipDeclared
        ? skipped
        : await slot.run({ key: target.key, subject: item.subject, side: "declared", mode: "interpret" }, CAP_MS);
      const bare = skipBare
        ? skipped
        : await slot.run({ key: target.key, subject: item.subject, side: "bare", mode: "interpret" }, CAP_MS);
      const compiled = skipDeclared
        ? skipped
        : await slot.run({ key: target.key, subject: item.subject, side: "declared", mode: "compiled" }, CAP_MS);
      row = { key: target.key, subject: item.subject, declared, bare, compiled };
    }
    if (row.declared.kind === "timeout") timeouts.declared++;
    if (row.bare.kind === "timeout") timeouts.bare++;
    const line = { ...row, source: item.source, ...(item.expected === undefined ? {} : { expected: item.expected }) };
    append(line);
    rowsOf.set(target.key, [...(rowsOf.get(target.key) ?? []), line]);
    if (++ran % 200 === 0) console.error(`${ran} rows this run, at ${target.key}`);
  }
});

await close();

if (incomplete > 0) {
  console.error(`${incomplete} definitions are not finished: run again to resume from ${RAW}`);
  process.exit(0);
}

const all = targets.flatMap(
  (target) => (rowsOf.get(target.key) ?? []) as unknown as (RowResult & { source: Source })[],
);
const listed: ListedRow[] = all
  .filter(
    (r) => finished(r.declared) && finished(r.bare) && r.declared.ms <= LIST_LIMIT_MS && r.bare.ms <= LIST_LIMIT_MS,
  )
  .map((r) => ({ key: r.key, subject: r.subject, declaredMs: r.declared.ms, bareMs: r.bare.ms }));
if (ONLY === "") writeList(OUT, listed);
report(targets);
console.log(
  ONLY === ""
    ? `\nwrote ${listed.length} rows to ${OUT}`
    : `\n${listed.length} rows would be listed (--only writes no list)`,
);
