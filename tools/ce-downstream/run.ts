// A fixed, fast slice of our tests against a compute-engine build, for compute-engine's own CI
// (cortex-js/compute-engine#515): the packages that lean hardest on its heads, about 15 minutes on a hosted runner.
//
//   node tools/ce-downstream/run.ts <tarball.tgz | compute-engine checkout> [--keep] [--summary FILE]
//
// A checkout is built and packed first (`npm ci`, `npm run build`, `npm pack`). The tarball then replaces
// the pinned version through the same pnpm override ce-main.yml writes (.github/scripts/compute-engine-tarball.ts),
// the slice's packages are built (`tools/ci/dist-cache.ts build`) and tested, and a summary of the failing tests
// with the first lines of each failure is printed (and appended to $GITHUB_STEP_SUMMARY, or --summary FILE).
//
// It rewrites pnpm-workspace.yaml and pnpm-lock.yaml in this checkout, so run it in a throwaway one (CI is);
// without --keep they are restored from git afterwards. Exits 1 on a test failure, 2 when the setup failed.
// Two failures are news, not regressions, and are listed apart without failing the run: a patch that
// compute-engine now ships natively (ce-patches' landed.test.ts), and the engine's version pin
// (ce-internals.test.ts), which fails whenever the build is not the version we pinned.

import { spawn, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs, stripVTControlCharacters } from "node:util";

const repo = resolve(import.meta.dirname, "../..");

/**
 * The slice: every library whose build does not read `combinatorics` (its cold build is about 90 minutes, and
 * reference, frontend and the rest read it), each a place compute-engine's behavior shows through. Their tests
 * are cheap (seconds to half a minute each), so the slice is all of them rather than a pick.
 */
const SLICE = [
  "engine", // our facade over compute-engine's internals: compiled routes, bigint, purity
  "ce-patches", // each patch's claim, and which have landed
  "analytic", // special functions: zeta, polylog, gamma, elliptic
  "number-theory", // bignum, rationals, modular arithmetic
  "residues",
  "numerals",
  "complex-numerals",
  "adeles",
  "structures",
  "evaluation",
  "hypercomplex",
  "geometric",
  "groupalgebra",
  "hecke",
  "hopf",
  "incidence",
  "quiver",
  "diagram",
  "modular",
  "braid",
  "polytope",
  "boxes",
].map((name) => `@enumeratio/${name}`);

const { positionals, values: args } = parseArgs({
  allowPositionals: true,
  options: { keep: { type: "boolean", default: false }, summary: { type: "string" } },
});
if (positionals.length !== 1) {
  console.error("usage: ce-downstream/run.ts <tarball.tgz | compute-engine checkout> [--keep] [--summary FILE]");
  process.exit(2);
}

const strip = stripVTControlCharacters;
const scratch = mkdtempSync(join(tmpdir(), "ce-downstream-"));
const setupSeconds: number[] = [];

/** Runs a command to completion; its output goes to ours, a group per step (the tail only when `quiet`). */
function sh(
  label: string,
  cmd: string,
  cmdArgs: string[],
  opts: { cwd?: string; env?: Record<string, string>; quiet?: boolean } = {},
) {
  console.log(`::group::${label}`);
  const start = Date.now();
  const r = spawnSync(cmd, cmdArgs, {
    cwd: opts.cwd ?? repo,
    env: { ...process.env, NO_COLOR: "1", ...opts.env },
    encoding: "utf8",
    maxBuffer: 1 << 29,
  });
  const text = strip(`${r.stdout ?? ""}${r.stderr ?? ""}`);
  console.log(opts.quiet ? text.split("\n").slice(-30).join("\n") : text);
  console.log("::endgroup::");
  setupSeconds.push((Date.now() - start) / 1000);
  return { ok: r.status === 0, text };
}

function must(r: { ok: boolean }, what: string): void {
  if (r.ok) return;
  console.error(`setup failed: ${what}`);
  process.exit(2);
}

function tarballOf(input: string): string {
  const path = resolve(input);
  if (path.endsWith(".tgz")) return path;
  if (!existsSync(join(path, "package.json")))
    throw new Error(`${path} is neither a .tgz nor a compute-engine checkout`);
  must(
    sh("compute-engine: npm ci", "npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], {
      cwd: path,
      quiet: true,
    }),
    "npm ci",
  );
  must(sh("compute-engine: build", "npm", ["run", "build"], { cwd: path, quiet: true }), "compute-engine build");
  const dest = join(scratch, "pack");
  mkdirSync(dest);
  // --ignore-scripts: the build is done, and `postpack` wants npm credentials
  must(
    sh("compute-engine: pack", "npm", ["pack", "--ignore-scripts", "--pack-destination", dest], { cwd: path }),
    "npm pack",
  );
  return join(
    dest,
    readdirSync(dest).find((f) => f.endsWith(".tgz"))!,
  );
}

const tarball = tarballOf(positionals[0]);
const tool = ".github/scripts/compute-engine-tarball.ts";
must(sh("use the compute-engine build", "node", [tool, "apply", tarball]), "override");
must(sh("pnpm install", "pnpm", ["install", "--no-frozen-lockfile"], { quiet: true }), "pnpm install");
must(
  sh("verify the swap", "node", [tool, "verify", tarball]),
  "the swap did not take: every package must resolve the tarball",
);

const build = sh("build the slice", "node", ["tools/ci/dist-cache.ts", "build", ...SLICE], {
  env: { BUILD_JOBS: "3", DIST_CACHE_DIR: join(scratch, "dist-cache") },
  quiet: true,
});
if (!build.ok) {
  const failed = /^::group::(.+) build failed$/m.exec(build.text)?.[1];
  console.error(`the slice did not build${failed ? ` (${failed})` : ""}: compute-engine broke our build, not a test`);
  process.exit(2);
}

interface Failure {
  pkg: string;
  head: string;
  lines: string;
}
const failures: Failure[] = [];
/** Failures that say something changed upstream rather than that something broke. */
const NEWS = /landed\.test\.ts|ce-internals\.test\.ts > compute-engine is the version/;
const news: string[] = [];
const ran: { pkg: string; seconds: number; failed: number }[] = [];

/** One package's tests: output streams to ours, then is read for vitest's failure headers. */
async function test(pkg: string): Promise<void> {
  const start = Date.now();
  console.log(`::group::test ${pkg}`);
  let out = "";
  const code = await new Promise<number>((done) => {
    const child = spawn("pnpm", ["--filter", pkg, "run", "test"], {
      cwd: repo,
      env: { ...process.env, NO_COLOR: "1" },
    });
    for (const stream of [child.stdout, child.stderr])
      stream.on("data", (d: Buffer) => {
        out += d;
        process.stdout.write(d);
      });
    child.on("close", (c) => done(c ?? 1));
  });
  console.log("::endgroup::");
  const lines = strip(out).split("\n");
  const seen = new Set<string>();
  const before = failures.length;
  lines.forEach((line, i) => {
    // vitest: " FAIL  tests/x.test.ts > suite > name", then the assertion and its diff
    if (!/^\s*FAIL\s+\S/.test(line) || seen.has(line.trim())) return;
    seen.add(line.trim());
    const head = line.trim().replace(/^FAIL\s+/, "");
    if (NEWS.test(head)) news.push(head);
    else
      failures.push({
        pkg,
        head,
        lines: lines
          .slice(i + 1, i + 8)
          .filter((l) => l.trim() !== "")
          .slice(0, 5)
          .join("\n"),
      });
  });
  // A non-zero exit with no readable failure (a crash, a timeout) is still a failure.
  if (code !== 0 && seen.size === 0)
    failures.push({
      pkg,
      head: "(no test failure read)",
      lines: lines
        .filter((l) => l.trim() !== "")
        .slice(-8)
        .join("\n"),
    });
  ran.push({ pkg, seconds: (Date.now() - start) / 1000, failed: failures.length - before });
}

// One package at a time: vitest already uses every core.
for (const s of SLICE) await test(s);

const version = (
  JSON.parse(
    readFileSync(join(repo, "packages/engine/node_modules/@cortex-js/compute-engine/package.json"), "utf8"),
  ) as {
    version: string;
  }
).version;
const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

const report = [
  `## Notatio slice against compute-engine ${version}`,
  "",
  failures.length === 0 ? "All green." : `${failures.length} failing test${failures.length === 1 ? "" : "s"}.`,
  "",
  "| package | failed | seconds |",
  "| --- | ---: | ---: |",
  ...ran.map((r) => `| ${r.pkg} | ${r.failed} | ${r.seconds.toFixed(0)} |`),
  "",
  ...(news.length > 0
    ? [
        "Changed upstream, not a regression (a patch that has landed, or the version pin):",
        "",
        ...news.map((l) => `- ${l}`),
        "",
      ]
    : []),
  ...failures.flatMap((f) => [
    `<details><summary>${f.pkg}: ${f.head.replace(/</g, "&lt;")}</summary>`,
    "",
    "```",
    f.lines,
    "```",
    "</details>",
    "",
  ]),
  `Setup ${sum(setupSeconds).toFixed(0)} s, tests ${sum(ran.map((r) => r.seconds)).toFixed(0)} s.`,
].join("\n");

console.log(`\n${report}`);
const summaryFile = args.summary ?? process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) appendFileSync(summaryFile, `${report}\n`);

if (!args.keep) spawnSync("git", ["checkout", "--", "pnpm-workspace.yaml", "pnpm-lock.yaml"], { cwd: repo });
process.exit(failures.length === 0 ? 0 : 1);
