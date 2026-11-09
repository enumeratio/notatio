// Pure data model + logic for the perf-drift history. No I/O here — collect.ts owns reading
// the history file, running vitest, and writing results back; this module is what's under test.

/** One test's duration within a single file, within a single package, within a single run. */
export interface TestDuration {
  file: string;
  name: string;
  durationMs: number;
}

/** One package's vitest run: per-file wall time, per-test durations, and the package total. */
export interface PackageRun {
  wallMs: number;
  files: Record<string, number>;
  tests: TestDuration[];
}

/** One CI run across every package sampled, keyed by commit. */
export interface RunRecord {
  sha: string;
  date: string; // ISO 8601
  /** Machine fingerprint (CPU model, cores, arch, runner image); absent on runs before it was recorded. */
  machine?: string;
  packages: Record<string, PackageRun>;
}

export interface History {
  runs: RunRecord[];
}

export const EMPTY_HISTORY: History = { runs: [] };

export function median(values: readonly number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].toSorted((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

/** Keep only the most recent `maxRuns` runs, oldest first, newest last. */
export function trimHistory(history: History, maxRuns = MAX_RUNS): History {
  return { runs: history.runs.slice(-maxRuns) };
}

export function appendRun(history: History, run: RunRecord, maxRuns = MAX_RUNS): History {
  return trimHistory({ runs: [...history.runs, run] }, maxRuns);
}

/** Every prior duration recorded for this exact (package, file, test), oldest first. */
export function trailingDurations(
  history: History,
  packageName: string,
  file: string,
  testName: string,
  machine?: string,
): number[] {
  const out: number[] = [];
  for (const run of history.runs) {
    if (machine !== undefined && run.machine !== machine) continue;
    const found = run.packages[packageName]?.tests.find((t) => t.file === file && t.name === testName);
    if (found) out.push(found.durationMs);
  }
  return out;
}

export interface DriftOptions {
  /** A test needs at least this many prior runs before drift is even considered. Default 5. */
  minPriorRuns?: number;
  /** Current must be at least this many times the trailing median. Default 1.5. */
  ratioThreshold?: number;
  /** ...and at least this many ms above the trailing median. Default 200. Both must hold —
   *  hosted runners wobble ~2x run to run, so a ratio alone on a 2ms test is noise. */
  absThresholdMs?: number;
  /** Prior runs on the current machine fingerprint needed for a same-runner baseline. Default 3. */
  minSameRunnerRuns?: number;
  /** Judged tests needed to trust the run-wide slowdown factor. Default 10. */
  minTestsForFactor?: number;
}

const DEFAULT_DRIFT_OPTIONS: Required<DriftOptions> = {
  minPriorRuns: 5,
  ratioThreshold: 1.5,
  absThresholdMs: 200,
  minSameRunnerRuns: 3,
  minTestsForFactor: 10,
};

export interface DriftFlag {
  package: string;
  file: string;
  test: string;
  currentMs: number;
  medianMs: number;
  ratio: number;
  absDiffMs: number;
  priorRuns: number;
  /** Baseline: earlier runs on the same machine fingerprint, or on every runner. */
  basis: "same-runner" | "cross-runner";
  /** This run's own median slowdown over all tests (at least 1): the runner, not the code. */
  runnerFactor: number;
}

/**
 * Compare `current` (a fresh run, not yet appended to `priorHistory`) against the trailing
 * median for every test it contains. Returns one flag per test that drifted past both
 * thresholds. `priorHistory` is the history *before* this run — call this before appendRun.
 *
 * A hosted runner of one fingerprint is not one machine, and different fingerprints differ
 * more, so a test is judged against earlier runs on the current fingerprint when it has enough
 * of them, else against every run. Either way the run's own median slowdown over all tests is
 * divided out: if everything is 1.4x slower, that is the runner, not a regression.
 */
export function detectDrift(current: RunRecord, priorHistory: History, options: DriftOptions = {}): DriftFlag[] {
  const opts = { ...DEFAULT_DRIFT_OPTIONS, ...options };
  const sameRuns = priorHistory.runs.filter((r) => current.machine !== undefined && r.machine === current.machine);
  const sameRunner = sameRuns.length >= opts.minSameRunnerRuns;
  const machine = sameRunner ? current.machine : undefined;
  const needed = sameRunner ? opts.minSameRunnerRuns : opts.minPriorRuns;

  // One pass over the baseline runs; per-test lookups against it were quadratic on a big history.
  const durations = new Map<string, number[]>();
  const keyOf = (pkg: string, file: string, name: string): string => JSON.stringify([pkg, file, name]);
  for (const run of priorHistory.runs) {
    if (machine !== undefined && run.machine !== machine) continue;
    for (const [pkg, pkgRun] of Object.entries(run.packages)) {
      for (const t of pkgRun.tests) {
        const k = keyOf(pkg, t.file, t.name);
        const list = durations.get(k);
        if (list === undefined) durations.set(k, [t.durationMs]);
        else list.push(t.durationMs);
      }
    }
  }

  const judged: Array<{ packageName: string; test: TestDuration; medianMs: number; priors: number }> = [];
  for (const [packageName, pkgRun] of Object.entries(current.packages)) {
    for (const test of pkgRun.tests) {
      const priors = durations.get(keyOf(packageName, test.file, test.name)) ?? [];
      if (priors.length < needed) continue;
      judged.push({ packageName, test, medianMs: median(priors), priors: priors.length });
    }
  }
  const runnerFactor =
    judged.length >= opts.minTestsForFactor
      ? Math.max(1, median(judged.map((j) => (j.medianMs > 0 ? j.test.durationMs / j.medianMs : 1))))
      : 1;

  const flags: DriftFlag[] = [];
  for (const { packageName, test, medianMs, priors } of judged) {
    const expectedMs = medianMs * runnerFactor;
    const ratio = expectedMs > 0 ? test.durationMs / expectedMs : Infinity;
    const absDiffMs = test.durationMs - expectedMs;
    if (ratio >= opts.ratioThreshold && absDiffMs >= opts.absThresholdMs) {
      flags.push({
        package: packageName,
        file: test.file,
        test: test.name,
        currentMs: test.durationMs,
        medianMs,
        ratio,
        absDiffMs,
        priorRuns: priors,
        basis: sameRunner ? "same-runner" : "cross-runner",
        runnerFactor,
      });
    }
  }
  // Worst offenders first.
  return flags.toSorted((a, b) => b.ratio - a.ratio);
}

/** The slowest N files in a run, across all packages, by wall time. For the --cpu-prof step. */
export function slowestFiles(run: RunRecord, n = 3): Array<{ package: string; file: string; durationMs: number }> {
  const all: Array<{ package: string; file: string; durationMs: number }> = [];
  for (const [packageName, pkgRun] of Object.entries(run.packages)) {
    for (const [file, durationMs] of Object.entries(pkgRun.files)) {
      all.push({ package: packageName, file, durationMs });
    }
  }
  return all.toSorted((a, b) => b.durationMs - a.durationMs).slice(0, n);
}

/** Runs kept in the history: the window the drift median reads. */
export const MAX_RUNS = 60;
/** The history file stays under GitHub's 100 MB file limit with room to grow; oldest runs go first past it. */
export const MAX_HISTORY_BYTES = 50_000_000;
/** The fewest runs the size bound may leave: the drift detector needs 5 priors, plus the next run. */
const MIN_RUNS_KEPT = 6;

/**
 * The file form of a history. Each (package, file, test name) is written once in `tests`, and a run's
 * `durations` is a flat `[index, ms, index, ms, ...]` into it, so a test name is not repeated per run.
 */
export interface PackedHistory {
  version: 2;
  tests: Array<[packageName: string, file: string, name: string]>;
  runs: Array<{
    sha: string;
    date: string;
    machine?: string;
    packages: Record<string, { wallMs: number; files: Record<string, number> }>;
    durations: number[];
  }>;
}

/** Durations are kept to a hundredth of a millisecond, far below the 200 ms drift floor. */
const roundMs = (ms: number): number => Math.round(ms * 100) / 100;

export function packHistory(history: History): PackedHistory {
  const tests: PackedHistory["tests"] = [];
  const index = new Map<string, number>();
  const runs = history.runs.map((run) => {
    const durations: number[] = [];
    const packages: PackedHistory["runs"][number]["packages"] = {};
    for (const [packageName, pkgRun] of Object.entries(run.packages)) {
      packages[packageName] = { wallMs: pkgRun.wallMs, files: pkgRun.files };
      for (const t of pkgRun.tests) {
        const key = JSON.stringify([packageName, t.file, t.name]);
        let i = index.get(key);
        if (i === undefined) {
          i = tests.length;
          index.set(key, i);
          tests.push([packageName, t.file, t.name]);
        }
        durations.push(i, roundMs(t.durationMs));
      }
    }
    return {
      sha: run.sha,
      date: run.date,
      ...(run.machine === undefined ? {} : { machine: run.machine }),
      packages,
      durations,
    };
  });
  return { version: 2, tests, runs };
}

/** Reads either form: the packed one, or the older `{ runs }` with every test spelled out per run. */
export function unpackHistory(data: PackedHistory | History): History {
  if (!("version" in data)) return data;
  return {
    runs: data.runs.map((run) => {
      const packages: Record<string, PackageRun> = {};
      for (const [packageName, p] of Object.entries(run.packages))
        packages[packageName] = { wallMs: p.wallMs, files: p.files, tests: [] };
      for (let k = 0; k < run.durations.length; k += 2) {
        const [packageName, file, name] = data.tests[run.durations[k]!]!;
        packages[packageName]!.tests.push({ file, name, durationMs: run.durations[k + 1]! });
      }
      return { sha: run.sha, date: run.date, ...(run.machine === undefined ? {} : { machine: run.machine }), packages };
    }),
  };
}

/** The file text: packed, unindented, and with the oldest runs dropped while it passes `maxBytes`. */
export function serializeHistory(history: History, maxBytes = MAX_HISTORY_BYTES): string {
  let kept = trimHistory(history, MAX_RUNS);
  let text = `${JSON.stringify(packHistory(kept))}\n`;
  while (text.length > maxBytes && kept.runs.length > MIN_RUNS_KEPT) {
    kept = trimHistory(kept, kept.runs.length - 1);
    text = `${JSON.stringify(packHistory(kept))}\n`;
  }
  return text;
}
