// Where compiled statistics decline over FindStat's crawl, and what the interpreter answers there.
//
//   node scripts/check-compiled-declines.ts list --crawl <dir> --out declines.json [--head A,B] [--stale]
//       every (statistic, object) of the crawl, in the definition's domain, that the statistic's compiled
//       code declines (a throw, or an answer `fromJs` refuses), with the reason. `--stale` takes a table entry
//       whatever its hash (the build the entry came from); without it, the code `compiledStatistic` would use.
//   node scripts/check-compiled-declines.ts interpret declines.json --out rows.json
//       each row through `interpretDefinition` on the bare engine and on the declared one (`createEngine(declareCombinatorics)`),
//       each in a child process killed at 30 s: the value and the seconds, held to FindStat's value.
//   node scripts/check-compiled-declines.ts compiled declines.json
//       which rows `compiledStatistic` answers now, and whether the answer is FindStat's.
//
// `<dir>` is a crawl's `StatisticsDatabase`; FINDSTAT_CRAWL names it when `--crawl` does not.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { type Expr, operandsOf } from "@notatio/engine";
import { fromJs, type MathJSON, runtimeHelpers } from "@notatio/engine/compiled";
import { bareEngine, createEngine } from "@notatio/engine/testing";
import { declareCombinatorics } from "../src/index.ts";
import { FLAT_BY_NAME, subjectToJs } from "../src/flat.ts";
import { ALL_STATISTICS } from "../src/statistics/all.ts";
import { COMPILED, compiledStatistic } from "../src/statistics/compiled.ts";
import { inDomain, interpretDefinition } from "../src/statistics/declare.ts";
import { bySignature, definitionKey, SUBJECT } from "../src/statistics/types.ts";
import { findstat } from "../findstat/src/findstat-data.ts";
import { COLLECTION_CARRIER, readObject } from "../findstat/src/objects.ts";

const SECONDS = 30;

interface Row {
  readonly signature: string;
  readonly id: string;
  readonly object: string;
  readonly expected: number;
  readonly reason?: string;
  readonly subject?: unknown;
  bare?: Answer;
  declared?: Answer;
}
interface Answer {
  readonly value?: unknown;
  readonly seconds: number;
  readonly status: "answered" | "timeout" | "error";
}

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? undefined : args[at + 1];
};

const DEFINITIONS = bySignature(ALL_STATISTICS);

/** The subject as the statistic's head reads it: a carrier value unwrapped. */
function subjectOf(ce: ReturnType<typeof bareEngine>, carrier: string, object: string): unknown {
  const boxed = ce.box(readObject(carrier, object) as never) as Expr;
  return (boxed.operator === carrier ? (operandsOf(boxed)[0] ?? boxed) : boxed).json;
}

/** The reason compiled code declines `subject`: an exception's message, or "fromJs", else undefined when it answers. */
function declineOf(
  ce: ReturnType<typeof bareEngine>,
  signature: string,
  subject: unknown,
  stale: boolean,
): string | undefined {
  const definition = DEFINITIONS.get(signature)!;
  const entry = COMPILED[signature];
  if (stale && entry !== undefined) {
    const nested = subjectToJs(subject);
    const flat = definition.flat !== undefined && entry.hash === definitionKey(definition);
    const codec = flat ? FLAT_BY_NAME[definition.on] : undefined;
    const value = codec === undefined || nested === undefined ? nested : codec.encode(nested);
    if (value === undefined) return "subject";
    try {
      return fromJs(entry.run(runtimeHelpers(ce) as never, { [SUBJECT]: value })) === undefined ? "fromJs" : undefined;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }
  const run = compiledStatistic(ce, definition);
  if (run === undefined) return "no compiled code";
  return run(subject) === undefined ? "declined" : undefined;
}

function list(): void {
  const crawl = flag("crawl") ?? process.env.FINDSTAT_CRAWL;
  if (crawl === undefined) throw new Error("--crawl <StatisticsDatabase> (or FINDSTAT_CRAWL) names the crawl");
  const heads = flag("head")?.split(",");
  const stale = args.includes("--stale");
  const snapshot = JSON.parse(readFileSync(new URL("../findstat/data/statistics.json", import.meta.url), "utf8")) as {
    items: Record<string, { collection: string }>;
  };
  const ce = createEngine(declareCombinatorics);
  const rows: Row[] = [];
  for (const match of findstat) {
    const signature = `${match.head}@${match.on}`;
    if (heads !== undefined && !heads.includes(match.head)) continue;
    const definition = DEFINITIONS.get(signature);
    if (definition === undefined || (COMPILED[signature] === undefined && definition.exact !== true)) continue;
    const seen = new Set<string>();
    for (const id of match.findstat) {
      if (COLLECTION_CARRIER[snapshot.items[id]?.collection ?? ""] !== match.on || !existsSync(`${crawl}/${id}.json`))
        continue;
      const data = JSON.parse(readFileSync(`${crawl}/${id}.json`, "utf8")) as { StatisticData: Record<string, number> };
      for (const [object, expected] of Object.entries(data.StatisticData)) {
        if (seen.has(object) || typeof expected !== "number" || readObject(match.on, object) === undefined) continue;
        let subject: unknown;
        try {
          subject = subjectOf(ce, match.on, object);
          if (!inDomain(ce, definition!, ce.box(subject as never))) continue;
        } catch {
          continue;
        }
        seen.add(object);
        const reason = declineOf(ce, signature, subject, stale);
        if (reason !== undefined) rows.push({ signature, id, object, expected, reason, subject });
      }
    }
  }
  const counts = new Map<string, number>();
  for (const row of rows)
    counts.set(`${row.signature}: ${row.reason}`, (counts.get(`${row.signature}: ${row.reason}`) ?? 0) + 1);
  for (const [key, n] of counts) console.log(`${n}\t${key}`);
  console.log(`${rows.length} declines`);
  writeFileSync(flag("out") ?? "declines.json", `${JSON.stringify(rows, null, 1)}\n`);
}

/** The child's job: one row's value on one engine, printed as JSON. */
function child(kind: string, signature: string, subjectText: string): void {
  const ce = kind === "bare" ? bareEngine() : createEngine(declareCombinatorics);
  const definition = DEFINITIONS.get(signature)!;
  const started = performance.now();
  const value = interpretDefinition(ce, definition, ce.box(JSON.parse(subjectText) as never)).json;
  console.log(JSON.stringify({ value, seconds: (performance.now() - started) / 1000 }));
}

function interpret(): void {
  const rows = JSON.parse(readFileSync(args[1]!, "utf8")) as Row[];
  for (const row of rows) {
    for (const kind of ["bare", "declared"] as const) {
      const started = performance.now();
      const run = spawnSync(
        "node",
        [new URL(import.meta.url).pathname, "child", kind, row.signature, JSON.stringify(row.subject)],
        { encoding: "utf8", timeout: SECONDS * 1000, killSignal: "SIGKILL" },
      );
      const seconds = (performance.now() - started) / 1000;
      let answer: Answer;
      if (run.status === 0) {
        const got = JSON.parse(run.stdout.trim().split("\n").at(-1)!) as { value: unknown; seconds: number };
        answer = { value: got.value, seconds: got.seconds, status: "answered" };
      } else answer = { seconds, status: run.signal === "SIGKILL" ? "timeout" : "error" };
      row[kind] = answer;
    }
    console.log(
      `${row.signature}\t${row.object}\tFindStat ${row.expected}\tbare ${JSON.stringify(row.bare?.value)} (${row.bare?.seconds.toFixed(2)}s)\tdeclared ${JSON.stringify(row.declared?.value)} (${row.declared?.seconds.toFixed(2)}s)`,
    );
  }
  writeFileSync(flag("out") ?? "rows.json", `${JSON.stringify(rows, null, 1)}\n`);
}

function compiled(): void {
  const rows = JSON.parse(readFileSync(args[1]!, "utf8")) as Row[];
  const ce = createEngine(declareCombinatorics);
  let answered = 0;
  for (const row of rows) {
    const run = compiledStatistic(ce, DEFINITIONS.get(row.signature)!);
    const got = run?.(row.subject) as MathJSON | undefined;
    if (got !== undefined) answered++;
    console.log(
      `${row.signature}\t${row.object}\t${got === undefined ? "declines" : `compiled ${JSON.stringify(got)}`}\t${got === row.expected ? "= FindStat" : got === undefined ? "" : "!= FindStat"}`,
    );
  }
  console.log(`${answered} of ${rows.length} answer compiled`);
}

if (import.meta.main) {
  const mode = args[0];
  if (mode === "list") list();
  else if (mode === "interpret") interpret();
  else if (mode === "compiled") compiled();
  else if (mode === "child") child(args[1]!, args[2]!, args[3]!);
  else throw new Error("expected list, interpret or compiled");
}
