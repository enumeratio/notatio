// Summarizes a `node --cpu-prof` profile: the functions with the most self time and the most inclusive time.
//
//   node packages/census/scripts/summarize-cpuprofile.ts FILE.cpuprofile [--top N]
//
// Times are in ms and as a share of the profile's sampled time. A function is named by its name, file and line.

import { readFileSync } from "node:fs";

interface Node {
  id: number;
  callFrame: { functionName: string; url: string; lineNumber: number };
  children?: number[];
}
interface Profile {
  nodes: Node[];
  samples: number[];
  timeDeltas: number[];
}

const path = process.argv[2];
if (path === undefined) throw new Error("usage: summarize-cpuprofile.ts FILE [--top N]");
const topAt = process.argv.indexOf("--top");
const top = topAt < 0 ? 25 : Number(process.argv[topAt + 1]);

const profile = JSON.parse(readFileSync(path, "utf8")) as Profile;
const byId = new Map(profile.nodes.map((node) => [node.id, node]));
const parent = new Map<number, number>();
for (const node of profile.nodes) for (const child of node.children ?? []) parent.set(child, node.id);

const name = (node: Node): string => {
  const { functionName, url, lineNumber } = node.callFrame;
  const file = url.replace(/^.*\/(packages|node_modules)\//, "$1/");
  return `${functionName === "" ? "(anonymous)" : functionName} ${file}:${lineNumber + 1}`;
};

const self = new Map<string, number>();
const inclusive = new Map<string, number>();
let total = 0;
profile.samples.forEach((id, i) => {
  const delta = (profile.timeDeltas[i] ?? 0) / 1000;
  total += delta;
  const leaf = byId.get(id)!;
  self.set(name(leaf), (self.get(name(leaf)) ?? 0) + delta);
  const seen = new Set<string>();
  for (let at: number | undefined = id; at !== undefined; at = parent.get(at)) {
    const label = name(byId.get(at)!);
    if (seen.has(label)) continue;
    seen.add(label);
    inclusive.set(label, (inclusive.get(label) ?? 0) + delta);
  }
});

const print = (title: string, table: Map<string, number>): void => {
  console.log(`\n${title} (total ${total.toFixed(0)} ms)`);
  for (const [label, ms] of [...table].toSorted((a, b) => b[1] - a[1]).slice(0, top))
    console.log(`${ms.toFixed(0).padStart(8)} ms ${((100 * ms) / total).toFixed(1).padStart(5)}%  ${label}`);
};
print("self time", self);
print("inclusive time", inclusive);

// `--callers NAME`: where the self time of functions called NAME comes from, by caller (`--depth` frames up, default 2).
const callersAt = process.argv.indexOf("--callers");
if (callersAt >= 0) {
  const wanted = process.argv[callersAt + 1]!;
  const depthAt = process.argv.indexOf("--depth");
  const depth = depthAt < 0 ? 2 : Number(process.argv[depthAt + 1]);
  const callers = new Map<string, number>();
  profile.samples.forEach((id, i) => {
    if (byId.get(id)!.callFrame.functionName !== wanted) return;
    const chain: string[] = [];
    for (let at = parent.get(id); at !== undefined && chain.length < depth; at = parent.get(at))
      chain.push(name(byId.get(at)!));
    const label = chain.join(" <- ");
    callers.set(label, (callers.get(label) ?? 0) + (profile.timeDeltas[i] ?? 0) / 1000);
  });
  print(`self time of ${wanted}, by caller`, callers);
}
