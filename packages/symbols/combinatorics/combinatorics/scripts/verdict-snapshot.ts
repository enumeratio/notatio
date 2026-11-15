// The committed snapshot of the compile steps' interpreter cross-checks (verdicts.tsv), the one
// expensive sweep of this package's build. A row is one checked item: its step, its signature,
// a key over what was checked, a source hash, its verdict, and the seconds its check took when it
// was collected (`-` when unknown; the deep job balances its parts by it). The build reads the
// snapshot and never runs the interpreter; `scripts/collect-verdicts.ts` writes it.
//
// The key hashes the item's `parts` (the definition, its compiled code, the subjects) and the
// checker code's identity (`checkers`, scripts/verdicts.ts). The source hash covers what needs no
// compiler: the item's `source` (the definition and the subjects, or what they are built from)
// and the same checker identity, so a step in `source` mode finds a stale row without compiling.
// The engine is in neither, so a compute-engine bump keeps every row; the deep test re-checks
// every row on the current engine.
//
// VERDICT_MODE picks what an item without a fresh row does:
//   build    (default) stays interpreted; the step counts them in one summary line
//   check    as build, writes no generated file, and fails when any row is missing or stale
//   collect  is checked, and the step's rows are rewritten (VERDICT_ALL=1: every item, even a fresh row)
//   verify   every item is checked and held to its row; nothing is written, and any difference fails
//   source   nothing is compiled or checked: each item's source hash is held to its row's, and a row
//            whose item is gone or whose source changed fails (an item with no row is not known to
//            be compilable, so only the build and `check` report a missing row)
//
// VERDICT_PART=i/n (verify): only the items of part i of n are checked, the parts balanced by the
// rows' recorded seconds (`partOf`); the others are taken as their rows say.

import { createHash } from "node:crypto";
import { appendFileSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Verdicts } from "../src/statistics/generate-compiled.ts";
import { assignShards, hashShard } from "./balance.ts";

const at = (path: string): string => fileURLToPath(new URL(`../${path}`, import.meta.url));

/** The committed file. */
export const SNAPSHOT = at("verdicts.tsv");

export interface Row {
  readonly step: string;
  /** The item: a definition's signature, a map's key, a family's head, with the check where one item has several. */
  readonly signature: string;
  readonly key: string;
  /** Over the item's source and the checker identity: what needs no compiler. */
  readonly source: string;
  /** `agrees`, or `disagrees` with the operations it disagrees on after a colon. */
  readonly verdict: string;
  /** How long the check took when it was collected; absent for a row nobody has timed. */
  readonly seconds?: number;
}

/** The rows a collect has made so far, one JSON row a line, so an interrupted run resumes (gitignored). */
export const journalOf = (file = SNAPSHOT): string => `${file}.journal`;

const HEADER = "step\tsignature\tkey\tsource\tverdict\tseconds";

// A cell that can't sit in a row as written is a JSON string.
const cell = (text: string): string => (/[\t\n\r]|^"|^$/.test(text) ? JSON.stringify(text) : text);
const uncell = (text: string): string => (text.startsWith('"') ? (JSON.parse(text) as string) : text);

const order = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** The rows of the file, empty when there is none. */
export function readSnapshot(file = SNAPSHOT): Row[] {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return text
    .split("\n")
    .slice(1)
    .filter((line) => line !== "")
    .map((line) => {
      const [step, signature, key, source, verdict, seconds] = line.split("\t").map(uncell);
      return {
        step: step!,
        signature: signature!,
        key: key!,
        source: source!,
        verdict: verdict!,
        ...(seconds === undefined || seconds === "-" ? {} : { seconds: Number(seconds) }),
      };
    });
}

/** Writes `rows` sorted by step then signature, whole (a rename), so equal rows give equal bytes. */
export function writeSnapshot(rows: readonly Row[], file = SNAPSHOT): void {
  const sorted = rows.toSorted((a, b) => order(a.step, b.step) || order(a.signature, b.signature));
  const lines = sorted.map((r) =>
    [r.step, r.signature, r.key, r.source, r.verdict, r.seconds === undefined ? "-" : String(r.seconds)]
      .map(cell)
      .join("\t"),
  );
  const tmp = `${file}.${process.pid}.tmp`;
  try {
    writeFileSync(tmp, `${[HEADER, ...lines].join("\n")}\n`);
    renameSync(tmp, file);
  } finally {
    rmSync(tmp, { force: true });
  }
}

export type Mode = "build" | "check" | "collect" | "verify" | "source";

export const modeOf = (): Mode => {
  const mode = process.env.VERDICT_MODE ?? "build";
  if (mode !== "build" && mode !== "check" && mode !== "collect" && mode !== "verify" && mode !== "source")
    throw new Error(`VERDICT_MODE ${mode}: expected build, check, collect, verify or source`);
  return mode;
};

/** The deep job's part, 1-based: `i/n` of VERDICT_PART, or undefined for the whole snapshot. */
export const partOfRun = (text = process.env.VERDICT_PART): { index: number; of: number } | undefined => {
  if (text === undefined || text === "") return undefined;
  const [index, of] = text.split("/").map(Number);
  if (!Number.isInteger(index) || !Number.isInteger(of) || index! < 1 || index! > of!)
    throw new Error(`VERDICT_PART ${text}: expected i/n with 1 <= i <= n`);
  return { index: index!, of: of! };
};

const itemKey = (step: string, signature: string): string => `${step}\0${signature}`;

/**
 * Each row's part (0-based) of `of`, the parts balanced by the rows' recorded seconds (a row
 * nobody has timed counts the median), so a heavy row can't pile into one part. Keyed by
 * `step\0signature`; an item with no row is not in it (`partOfItem` hashes it).
 */
export function partsOf(rows: readonly Row[], of: number): Map<string, number> {
  const costs: Record<string, number> = {};
  for (const r of rows) if (r.seconds !== undefined) costs[itemKey(r.step, r.signature)] = r.seconds;
  return assignShards(
    rows.map((r) => itemKey(r.step, r.signature)),
    of,
    costs,
  );
}

/** Whether a mode runs the interpreter. */
export const checks = (mode: Mode = modeOf()): boolean => mode === "collect" || mode === "verify";

/** Whether the step writes its generated file. */
export const writes = (mode: Mode = modeOf()): boolean => mode === "build" || mode === "collect";

const hashOf = (...texts: string[]): string => {
  const hash = createHash("sha256");
  for (const text of texts) hash.update(`${text.length}\0`).update(text);
  return hash.digest("hex");
};

/** The identity of the code that does the checking: its files (paths relative to the package). */
export const checkerId = (files: readonly string[]): string =>
  hashOf(...files.toSorted().flatMap((f) => [f, readFileSync(at(f), "utf8")]));

/** A verdict as a row spells it: a boolean, or the operations that disagree. */
const encode = (value: boolean | readonly string[]): string =>
  value === true || (Array.isArray(value) && value.length === 0)
    ? "agrees"
    : value === false
      ? "disagrees"
      : `disagrees: ${(value as readonly string[]).join(",")}`;

const decode = <T extends boolean | readonly string[]>(verdict: string, declined: T): T => {
  if (verdict === "agrees") return (typeof declined === "boolean" ? true : []) as T;
  if (typeof declined === "boolean") return false as T;
  return verdict.slice("disagrees: ".length).split(",") as unknown as T;
};

/** What one process learned, which crosses a process boundary as JSON. */
export interface Share {
  rows: Row[];
  /** Items with no fresh row, and why. */
  unfresh: string[];
  /** Items whose verdict differs from the row they had. */
  changed: string[];
  fresh: number;
  /** Every item looked at, fresh or not. */
  seen: string[];
}

/** One step's verdicts, read from the snapshot (or checked, by mode) and kept for `save`. */
export class Snapshot implements Verdicts {
  private readonly old = new Map<string, Row>();
  private readonly id: string;
  private readonly journal = new Map<string, Row>();
  private readonly rows = new Map<string, Row>();
  private readonly unfresh: string[] = [];
  private readonly changed: string[] = [];
  private fresh = 0;
  private readonly seen = new Set<string>();
  private readonly step: string;
  private readonly mode: Mode;
  private readonly file: string;
  private readonly all: boolean;

  constructor(
    step: string,
    checkers: readonly string[],
    mode: Mode = modeOf(),
    file = SNAPSHOT,
    all = process.env.VERDICT_ALL === "1",
  ) {
    this.step = step;
    this.mode = mode;
    this.file = file;
    this.all = all;
    for (const row of readSnapshot(file)) if (row.step === step) this.old.set(row.signature, row);
    this.id = checkerId(checkers);
    if (mode === "collect") {
      try {
        for (const line of readFileSync(journalOf(file), "utf8").split("\n")) {
          const row = line === "" ? undefined : (JSON.parse(line) as Row);
          if (row?.step === step) this.journal.set(row.signature, row);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
  }

  /** Whether the step reads source hashes only: its items are not compiled, and `note` takes the place of `remember`. */
  get sourceOnly(): boolean {
    return this.mode === "source";
  }

  private sourceHash(source: unknown): string {
    return hashOf(this.id, JSON.stringify(source)).slice(0, 24);
  }

  /** Whether the part of this run (VERDICT_PART) takes the item; every item when there is no part. */
  private takes(label: string): boolean {
    const part = partOfRun();
    if (part === undefined) return true;
    this.parts ??= partsOf(readSnapshot(this.file), part.of);
    const at = itemKey(this.step, label);
    return (this.parts.get(at) ?? hashShard(at, part.of)) === part.index - 1;
  }

  private parts: Map<string, number> | undefined;

  /** In `source` mode: the item `label` is looked at with this `source`, and a row whose source differs is stale. */
  note(source: unknown, label: string): void {
    this.seen.add(label);
    const had = this.old.get(label);
    if (had !== undefined && had.source !== this.sourceHash(source)) this.unfresh.push(`${label} (stale)`);
  }

  /** `parts` is everything the verdict reads (the key); `source` is the part of it that needs no compiler. */
  remember<T extends boolean | readonly string[]>(
    parts: unknown,
    source: unknown,
    compute: () => T,
    label: string,
    declined: T,
  ): T {
    const key = hashOf(this.id, JSON.stringify(parts)).slice(0, 24);
    const sourceKey = this.sourceHash(source);
    this.seen.add(label);
    const had = this.old.get(label);
    const sameKey = had?.key === key;
    const isFresh = sameKey && had.source === sourceKey;
    if (!checks(this.mode)) {
      if (!isFresh) {
        this.unfresh.push(`${label} (${had === undefined ? "missing" : "stale"})`);
        return declined;
      }
      this.fresh++;
      this.rows.set(label, had!);
      return decode(had!.verdict, declined);
    }
    // A part checks only its own items; the rest are taken as their rows say, and not reported.
    if (this.mode === "verify" && !this.takes(label))
      return had === undefined ? declined : decode(had.verdict, declined);
    if (sameKey && !this.all && this.mode === "collect") {
      this.fresh++;
      this.rows.set(label, { ...had!, source: sourceKey });
      return decode(had!.verdict, declined);
    }
    // A row an interrupted collect already made (it is not kept past a finished run).
    const made = this.mode === "collect" ? this.journal.get(label) : undefined;
    const reused = made?.key === key && made.source === sourceKey;
    const started = performance.now();
    const answer = reused ? decode(made.verdict, declined) : compute();
    const seconds = Math.round((performance.now() - started) / 10) / 100;
    const row: Row = reused
      ? made
      : { step: this.step, signature: label, key, source: sourceKey, verdict: encode(answer), seconds };
    if (this.mode === "collect" && row !== made) appendFileSync(journalOf(this.file), `${JSON.stringify(row)}\n`);
    this.rows.set(label, row);
    if (had === undefined) this.unfresh.push(`${label} (missing)`);
    else if (!isFresh) this.unfresh.push(`${label} (stale)`);
    if (had !== undefined && had.verdict !== row.verdict)
      this.changed.push(`${label}: ${had.verdict} -> ${row.verdict}`);
    return answer;
  }

  share(): Share {
    return {
      rows: [...this.rows.values()],
      unfresh: this.unfresh,
      changed: this.changed,
      fresh: this.fresh,
      seen: [...this.seen],
    };
  }

  adopt(share: Share): void {
    for (const row of share.rows) this.rows.set(row.signature, row);
    this.unfresh.push(...share.unfresh);
    this.changed.push(...share.changed);
    this.fresh += share.fresh;
    for (const label of share.seen) this.seen.add(label);
  }

  /** Ends the step: build prints its count, collect rewrites the step's rows, check and verify fail on a difference. */
  save(): void {
    const { mode, step } = this;
    if (mode === "collect") {
      const rest = readSnapshot(this.file).filter((r) => r.step !== step);
      writeSnapshot([...rest, ...this.rows.values()], this.file);
      for (const line of this.changed) console.log(`verdicts ${step}: changed ${line}`);
      const gone = [...this.old.keys()].filter((label) => !this.seen.has(label)).length;
      console.log(
        `verdicts ${step}: ${this.rows.size} rows, ${this.unfresh.length} checked (missing or stale)` +
          (gone > 0 ? `, ${gone} dropped` : ""),
      );
      return;
    }
    // Every part sees every item, so one part reports the rows whose item is gone.
    const gone = (partOfRun()?.index ?? 1) === 1 ? [...this.old.keys()].filter((label) => !this.seen.has(label)) : [];
    if (mode === "source") {
      const problems = [...this.unfresh, ...gone.map((g) => `${g} (no such item)`)];
      for (const problem of problems.slice(0, 40)) console.log(`verdicts ${step}: ${problem}`);
      if (problems.length > 40) console.log(`verdicts ${step}: and ${problems.length - 40} more`);
      if (problems.length > 0)
        throw new Error(
          `verdicts ${step}: ${problems.length} rows stale or without an item; run \`pnpm run collect-verdicts\``,
        );
      console.log(`verdicts ${step}: every row's source holds`);
      return;
    }
    if (mode === "verify") {
      const problems = [
        ...this.unfresh,
        ...this.changed.map((c) => `changed ${c}`),
        ...gone.map((g) => `${g} (no such item)`),
      ];
      for (const problem of problems) console.log(`verdicts ${step}: ${problem}`);
      if (problems.length > 0) throw new Error(`verdicts ${step}: ${problems.length} rows differ from the snapshot`);
      console.log(`verdicts ${step}: every row holds`);
      return;
    }
    console.log(
      `verdicts ${step}: ${this.unfresh.length} left interpreted for want of a fresh verdict, ${this.fresh} fresh`,
    );
    if (mode === "check") {
      for (const label of this.unfresh.slice(0, 20)) console.log(`verdicts ${step}: ${label}`);
      if (this.unfresh.length > 20) console.log(`verdicts ${step}: and ${this.unfresh.length - 20} more`);
      for (const label of gone) console.log(`verdicts ${step}: ${label} (no such item)`);
      if (this.unfresh.length > 0 || gone.length > 0)
        throw new Error(`verdicts ${step}: rows missing or stale; run \`pnpm run collect-verdicts\``);
    }
  }
}
