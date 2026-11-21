// The interpreter sweep: how far the interpreter can be trusted on every statistic and map definition.
//
// Two passes over (definition, subject) rows:
//   1. the engine with every library declared (census's `fullEngine()`) against a bare compute-engine, both
//      interpreting the definition: a declaration that changes what a definition evaluates to, or how long it
//      takes, shows here;
//   2. the declared engine's interpreter against the compiled code (the generated code, or a hand-written
//      kernel): the definition is the meaning and the compiled code is held to it.
//
// A call runs in a worker process under a time cap. A call past it kills the worker and a new one takes its
// place, so a hung definition costs the cap and nothing else; each worker writes the call it is about to run
// to a file first, so one that dies names its row. `collect-interpreter-sweep.ts` measures every row and writes
// the committed list of the rows both sides finish within a second; the nightly test (`tests/interpreter-sweep
// .test.ts`) runs one slice of that list.

import { type ChildProcess, fork } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compiledRoute, interpret, type SweepTarget, sweepTargets, targetSubjects } from "@notatio/combinatorics/sweep";
import type { Engine } from "@notatio/engine";
import { bareEngine } from "@notatio/engine/testing";
import { fullEngine } from "../src/engine.ts";

/** Which engine a call runs on, and by which route. `compiled` always runs on the declared engine. */
export type Side = "declared" | "bare";
export type Mode = "interpret" | "compiled";

/** One call of the worker. A subject is the carrier's contents as MathJSON. */
export interface Task {
  readonly key: string;
  readonly subject: unknown;
  readonly side: Side;
  readonly mode: Mode;
}

export type Request =
  | { readonly op: "run"; readonly id: number; readonly task: Task }
  | { readonly op: "subjects"; readonly id: number; readonly key: string };

/**
 * What a call came to: an `answer` (its MathJSON as text), `declined` (a map's guard, or compiled code with
 * no answer), an `error` (thrown, or an answer holding an `Error` expression), `none` (no compiled route),
 * `timeout` (past the cap), `died` (the worker was lost: its message names the call and the last of its stderr)
 * or `skipped` (not run: the collector leaves a side's heavier subjects once it has timed out twice on a definition).
 */
export interface Outcome {
  readonly kind: "answer" | "declined" | "error" | "none" | "timeout" | "died" | "skipped";
  readonly ms: number;
  readonly text?: string;
}

const TEXT_LIMIT = 300;

function outcomeOf(value: unknown, ms: number): Outcome {
  if (value === undefined) return { kind: "declined", ms };
  const text = JSON.stringify(value);
  return text.includes('"Error"')
    ? { kind: "error", ms, text: text.slice(0, TEXT_LIMIT) }
    : { kind: "answer", ms, text };
}

export interface Executor {
  run(task: Task): Outcome;
  subjects(key: string): { small: unknown[]; large: unknown[] };
}

/** The sweep's two engines and the calls that run on them. One of each per worker, reused across subjects. */
export function makeExecutor(): Executor {
  const declared = fullEngine() as unknown as Engine;
  const bare = bareEngine() as unknown as Engine;
  const targets = new Map<string, SweepTarget>(sweepTargets().map((target) => [target.key, target]));
  const routes = new Map<string, ((contents: unknown) => unknown) | undefined>();
  const target = (key: string): SweepTarget => {
    const found = targets.get(key);
    if (found === undefined) throw new Error(`the sweep has no definition ${key}`);
    return found;
  };
  return {
    run({ key, subject, side, mode }) {
      const started = performance.now();
      try {
        const definition = target(key);
        if (mode === "compiled") {
          if (!routes.has(key)) routes.set(key, compiledRoute(declared, definition));
          const route = routes.get(key);
          if (route === undefined) return { kind: "none", ms: 0 };
          const value = route(subject);
          return outcomeOf(value, performance.now() - started);
        }
        const value = interpret(side === "declared" ? declared : bare, definition, subject);
        return outcomeOf(value, performance.now() - started);
      } catch (error) {
        return { kind: "error", ms: performance.now() - started, text: String(error).slice(0, TEXT_LIMIT) };
      }
    },
    subjects: (key) => targetSubjects(bare, target(key)),
  };
}

// ---- Workers -------------------------------------------------------------------------------------------

const WORKER = new URL("./interpreter-sweep-worker.ts", import.meta.url).pathname;

/** A worker is replaced after this many calls, as an engine accrues state. */
const RECYCLE_AFTER = 400;
/** A worker's old-space limit in MB: a runaway definition aborts itself and names its row, not the box. */
const HEAP_MB = 1536;
/** The time a new worker has to build its engines. */
const START_MS = 300_000;

type Reply = { id: number } & Partial<Outcome> & { subjects?: { small: unknown[]; large: unknown[] } };

/** One worker process at a time, replaced on a timeout, a death or after `RECYCLE_AFTER` calls. */
export class WorkerSlot {
  private child: ChildProcess | undefined;
  private calls = 0;
  private next = 0;
  private stderr = "";
  private readonly current: string;
  readonly name: string;

  constructor(name: string, directory: string) {
    this.name = name;
    this.current = join(directory, `${name}.current`);
  }

  private start(): Promise<void> {
    this.calls = 0;
    this.stderr = "";
    const child = fork(WORKER, [], {
      env: { ...process.env, SWEEP_CURRENT: this.current },
      execArgv: [`--max-old-space-size=${HEAP_MB}`],
      stdio: ["ignore", "inherit", "pipe", "ipc"],
    });
    child.stderr!.on("data", (chunk: Buffer) => {
      this.stderr = (this.stderr + chunk.toString()).slice(-2000);
    });
    this.child = child;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error(`${this.name}: no engine after ${START_MS / 1000} s`));
      }, START_MS);
      child.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`${this.name}: exited at start (${code}): ${this.stderr}`));
      });
      child.on("message", function ready(message: { ready?: true }) {
        if (message.ready !== true) return;
        clearTimeout(timer);
        child.off("message", ready);
        child.removeAllListeners("exit");
        resolve();
      });
    });
  }

  /** Stops the worker. */
  async stop(): Promise<void> {
    const child = this.child;
    this.child = undefined;
    if (child === undefined || child.exitCode !== null || child.signalCode !== null) return;
    await new Promise<void>((resolve) => {
      child.once("exit", () => resolve());
      child.kill("SIGKILL");
    });
  }

  /** The call the worker last wrote itself, for naming a row it died on. */
  private lastCall(): string {
    try {
      return readFileSync(this.current, "utf8");
    } catch {
      return "no call recorded";
    }
  }

  private async send(
    request: { readonly op: "run"; readonly task: Task } | { readonly op: "subjects"; readonly key: string },
    capMs: number,
  ): Promise<Reply | Outcome> {
    if (this.child === undefined || this.calls >= RECYCLE_AFTER) {
      await this.stop();
      await this.start();
    }
    const child = this.child!;
    this.calls++;
    const id = ++this.next;
    const started = performance.now();
    return new Promise((resolve) => {
      const done = (reply: Reply | Outcome): void => {
        clearTimeout(timer);
        child.off("message", onMessage);
        child.off("exit", onExit);
        resolve(reply);
      };
      const onMessage = (message: Reply): void => {
        if (message.id === id) done(message);
      };
      const onExit = (code: number | null, signal: string | null): void => {
        this.child = undefined;
        const text = `worker ${this.name} died (${signal ?? code}) on ${this.lastCall()}; stderr: ${this.stderr.slice(-400)}`;
        done({ kind: "died", ms: performance.now() - started, text });
      };
      const timer = setTimeout(() => {
        this.child = undefined;
        child.kill("SIGKILL");
        done({ kind: "timeout", ms: capMs });
      }, capMs);
      child.on("message", onMessage);
      child.on("exit", onExit);
      child.send({ ...request, id } as Request);
    });
  }

  /** One call under `capMs`. */
  async run(task: Task, capMs: number): Promise<Outcome> {
    const reply = (await this.send({ op: "run", task }, capMs)) as Outcome;
    return { kind: reply.kind, ms: reply.ms, ...(reply.text === undefined ? {} : { text: reply.text }) };
  }

  /** The subjects the sweep generates for a definition, under `capMs`, or `undefined` past it. */
  async subjects(key: string, capMs: number): Promise<{ small: unknown[]; large: unknown[] } | undefined> {
    const reply = (await this.send({ op: "subjects", key }, capMs)) as Reply;
    return reply.subjects;
  }
}

/** A directory for the workers' call files, and the slots that use it; `close` stops them and removes it. */
export function openSlots(count: number): { slots: WorkerSlot[]; close: () => Promise<void> } {
  const directory = mkdtempSync(join(tmpdir(), "interpreter-sweep-"));
  const slots = Array.from({ length: count }, (_, i) => new WorkerSlot(`worker-${i + 1}`, directory));
  return {
    slots,
    close: async () => {
      await Promise.all(slots.map((slot) => slot.stop()));
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

/** Runs `job` over `items`, each slot taking the next item as it frees. */
export async function overSlots<T>(
  slots: readonly WorkerSlot[],
  items: readonly T[],
  job: (item: T, slot: WorkerSlot) => Promise<void>,
): Promise<void> {
  let next = 0;
  await Promise.all(
    slots.map(async (slot) => {
      while (next < items.length) await job(items[next++]!, slot);
    }),
  );
}

// ---- Rows ----------------------------------------------------------------------------------------------

/** A row measured: the declared and bare interpreter, and the compiled code on the declared engine. */
export interface RowResult {
  readonly key: string;
  readonly subject: unknown;
  readonly declared: Outcome;
  readonly bare: Outcome;
  readonly compiled: Outcome;
}

/** Runs one row on a slot: each side under `capMs`. */
export async function measureRow(slot: WorkerSlot, key: string, subject: unknown, capMs: number): Promise<RowResult> {
  const declared = await slot.run({ key, subject, side: "declared", mode: "interpret" }, capMs);
  const bare = await slot.run({ key, subject, side: "bare", mode: "interpret" }, capMs);
  const compiled = await slot.run({ key, subject, side: "declared", mode: "compiled" }, capMs);
  return { key, subject, declared, bare, compiled };
}

/** Whether a call ran to an end of its own: it answered, declined or errored. */
export const finished = (o: Outcome): boolean => o.kind !== "timeout" && o.kind !== "died" && o.kind !== "skipped";
/** `measureRow` in this process, with no worker and no cap: for a few cheap rows. */
export function measureRowIn(executor: Executor, key: string, subject: unknown): RowResult {
  const run = (side: Side, mode: Mode): Outcome => executor.run({ key, subject, side, mode });
  return {
    key,
    subject,
    declared: run("declared", "interpret"),
    bare: run("bare", "interpret"),
    compiled: run("declared", "compiled"),
  };
}

const sameOutcome = (a: Outcome, b: Outcome): boolean =>
  a.kind === b.kind && (a.kind !== "answer" || a.text === b.text);

/** Pass 1's class of a row: `agree`, `declared-error` or `declared-wrong` (the bare answer stands), `bare-error`,
 *  `slow-declared`, `slow-bare`, `slow-both` or `died`. */
export function classifyDeclared(row: Pick<RowResult, "declared" | "bare">): string {
  const { declared, bare } = row;
  if (declared.kind === "died" || bare.kind === "died") return "died";
  if (declared.kind === "skipped" || bare.kind === "skipped") return "not-run";
  if (declared.kind === "timeout") return bare.kind === "timeout" ? "slow-both" : "slow-declared";
  if (bare.kind === "timeout") return "slow-bare";
  if (sameOutcome(declared, bare)) return "agree";
  if (declared.kind === "error") return "declared-error";
  if (bare.kind === "error") return "bare-error";
  return "declared-wrong";
}

/** Pass 2's class: `right` (interpreted equals compiled), `wrong`, `error` (the interpreter errors where compiled
 *  answers), `slow`, `no-compiled` (no compiled route, or it declines: nothing to compare), `compiled-error`,
 *  `compiled-slow` or `died`. */
export function classifyCompiled(row: Pick<RowResult, "declared" | "compiled">): string {
  const { declared, compiled } = row;
  if (declared.kind === "died" || compiled.kind === "died") return "died";
  if (declared.kind === "skipped" || compiled.kind === "skipped") return "not-run";
  if (compiled.kind === "timeout") return "compiled-slow";
  if (compiled.kind === "error") return "compiled-error";
  if (compiled.kind === "none" || compiled.kind === "declined") return "no-compiled";
  if (declared.kind === "timeout") return "slow";
  if (declared.kind === "error") return "error";
  return sameOutcome(declared, compiled) ? "right" : "wrong";
}

/** The classes that fail the nightly: a declared engine that answers differently, errors or is slower where the
 *  bare one answers, an interpreter that disagrees with its compiled code, or a worker lost. A row both sides
 *  time out on is slow on its own account and is only counted. */
export const FAILING = new Set([
  "declared-error",
  "declared-wrong",
  "bare-error",
  "slow-declared",
  "died",
  "wrong",
  "error",
  "compiled-error",
  "compiled-slow",
]);

/** The family a definition belongs to: `stat:<carrier>` for a statistic, `map:<source type>` for a map. */
export const familyOf = (key: string): string => {
  const on = key.slice(key.indexOf("@") + 1);
  return /^[A-Z]/.test(on) ? `stat:${on}` : `map:${on}`;
};

/** A tally of classes, and the declared and bare interpreter's total time over the rows both finished. */
export interface Summary {
  readonly rows: number;
  readonly pass1: Record<string, number>;
  readonly pass2: Record<string, number>;
  readonly declaredMs: number;
  readonly bareMs: number;
  /** Total declared time over total bare time, over the rows both sides finished with an answer. */
  readonly ratio: number;
  readonly failures: readonly { row: RowResult; pass: 1 | 2; class: string }[];
}

export function summarise(rows: readonly RowResult[]): Summary {
  const pass1: Record<string, number> = {};
  const pass2: Record<string, number> = {};
  const failures: { row: RowResult; pass: 1 | 2; class: string }[] = [];
  let declaredMs = 0;
  let bareMs = 0;
  for (const row of rows) {
    const one = classifyDeclared(row);
    const two = classifyCompiled(row);
    pass1[one] = (pass1[one] ?? 0) + 1;
    pass2[two] = (pass2[two] ?? 0) + 1;
    if (FAILING.has(one)) failures.push({ row, pass: 1, class: one });
    if (FAILING.has(two)) failures.push({ row, pass: 2, class: two });
    if (finished(row.declared) && finished(row.bare)) {
      declaredMs += row.declared.ms;
      bareMs += row.bare.ms;
    }
  }
  return {
    rows: rows.length,
    pass1,
    pass2,
    declaredMs,
    bareMs,
    ratio: bareMs === 0 ? 1 : declaredMs / bareMs,
    failures,
  };
}

/** A failure as one line for a report: the class, the definition, the subject and what each side said. */
export function describe(failure: Summary["failures"][number]): string {
  const { row, pass, class: kind } = failure;
  const side = (o: Outcome): string =>
    `${o.kind}${o.text === undefined ? "" : ` ${o.text.slice(0, 120)}`} (${o.ms.toFixed(0)} ms)`;
  const other = pass === 1 ? `bare ${side(row.bare)}` : `compiled ${side(row.compiled)}`;
  return `${kind}: ${row.key} ${JSON.stringify(row.subject)}\n    declared ${side(row.declared)}\n    ${other}`;
}

// ---- The committed list and its slices -----------------------------------------------------------------

/** The nightly runs one of this many slices a night, by a stable hash of the row. */
export const SLICES = 7;

/** FNV-1a over the definition and the subject's JSON: the same on every machine and in every run. */
export function hashRow(key: string, subject: unknown): number {
  let hash = 0x811c9dc5;
  for (const byte of Buffer.from(`${key}\0${JSON.stringify(subject)}`)) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  return hash;
}

/** The slice (0 to `SLICES` - 1) a row belongs to. */
export const sliceOf = (key: string, subject: unknown): number => hashRow(key, subject) % SLICES;

/** Tonight's slice: `NIGHTLY_SLICE` if set, else the day of the year (UTC) modulo `SLICES`. */
export function tonightsSlice(env: Record<string, string | undefined> = process.env, now = new Date()): number {
  const given = env.NIGHTLY_SLICE;
  if (given !== undefined && given !== "") {
    const slice = Number(given);
    if (!Number.isInteger(slice) || slice < 0 || slice >= SLICES)
      throw new Error(`NIGHTLY_SLICE=${given}: not a slice 0 to ${SLICES - 1}`);
    return slice;
  }
  const day = Math.floor(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(now.getUTCFullYear(), 0, 0)) /
      86_400_000,
  );
  return day % SLICES;
}

/** A row of the committed list: a definition, a subject, and what each side's interpreter took here, in ms. */
export interface ListedRow {
  readonly key: string;
  readonly subject: unknown;
  readonly declaredMs: number;
  readonly bareMs: number;
}

const HEADER = "definition\tsubject\tdeclared_ms\tbare_ms";

/** The time to the precision the list keeps: a decimal under 10 ms, whole milliseconds above. */
const timeText = (ms: number): string => (ms < 10 ? ms.toFixed(1) : String(Math.round(ms)));

export function writeList(path: string, rows: readonly ListedRow[]): void {
  const lines = rows.map(
    (row) => `${row.key}\t${JSON.stringify(row.subject)}\t${timeText(row.declaredMs)}\t${timeText(row.bareMs)}`,
  );
  writeFileSync(path, `${[HEADER, ...lines].join("\n")}\n`);
}

export function readList(path: string): ListedRow[] {
  const [header, ...lines] = readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line !== "");
  if (header !== HEADER) throw new Error(`${path}: not an interpreter sweep list`);
  return lines.map((line) => {
    const [key, subject, declaredMs, bareMs] = line.split("\t");
    return {
      key: key!,
      subject: JSON.parse(subject!) as unknown,
      declaredMs: Number(declaredMs),
      bareMs: Number(bareMs),
    };
  });
}
