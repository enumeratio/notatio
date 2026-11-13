// The codemods a branch hasn't run yet, oldest first, each with the commands that port it
// (wiki: Contributing, "Codemods").
//
//   node tools/codemods/pending.ts [--base origin/main] [--head HEAD]
//
// Git history is the registry: a codemod's landing commit is the first commit on the base's
// first-parent history that added `tools/codemods/<name>.ts`, so one removed since is still found.
// It is pending when that commit is not an ancestor of the head.

import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "origin/main" },
    head: { type: "string", default: "HEAD" },
  },
});
const base = values.base!;
const head = values.head!;

const git = (...args: string[]): string => execFileSync("git", args, { encoding: "utf8" }).trim();
const isAncestor = (commit: string, of: string): boolean => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", commit, of]);
    return true;
  } catch {
    return false;
  }
};

const NOT_A_CODEMOD = new Set(["pending"]);

// Oldest first; a script added twice (removed, then re-added) counts from its first landing.
const landings = new Map<string, string>();
const log = git(
  "log",
  "--first-parent",
  "--reverse",
  "--diff-filter=A",
  "--name-only",
  "--format=%x00%H",
  base,
  "--",
  "tools/codemods/",
);
for (const block of log.split("\0").filter(Boolean)) {
  const [commit, ...paths] = block.trim().split("\n");
  for (const path of paths) {
    const name = /^tools\/codemods\/([\w-]+)\.ts$/.exec(path.trim())?.[1];
    if (name !== undefined && !NOT_A_CODEMOD.has(name) && !landings.has(name)) landings.set(name, commit!);
  }
}

const pending = [...landings].filter(([, commit]) => !isAncestor(commit, head));
if (pending.length === 0) {
  console.log(`${head} has every codemod on ${base}.`);
  process.exit(0);
}
for (const [name, commit] of pending) {
  const short = commit.slice(0, 9);
  console.log(`# ${name}, landed in ${short} ${git("log", "-1", "--format=%s", commit)}`);
  console.log(`git rebase ${short}^`);
  console.log("mkdir -p .scratch");
  console.log(`git show ${short}:tools/codemods/${name}.ts > .scratch/${name}.ts`);
  console.log(`node .scratch/${name}.ts    # then the after-steps its header names`);
  console.log(`git add -u && git commit -m "chore: apply the ${name} codemod"`);
  console.log(`git rebase ${base}`);
  console.log("");
}
