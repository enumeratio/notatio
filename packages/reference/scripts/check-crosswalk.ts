// Resolve every crosswalk link and report the ones that do not answer.
//
// The crosswalk is a table of pointers into other people's sites, and the only way to know
// a pointer is still good is to follow it. This is that lane: offline data, online check,
// never a gate -- run it when adding rows, or when a system is known to have moved.
//
//   vp node packages/reference/scripts/check-crosswalk.ts [--only wikipedia,mathworld] [--head Zeta]
//
// Reports each URL that is not a 2xx (a 3xx to the same page counts as fine) with the
// heads that point at it. Two systems are skipped unless asked for by `--only`: Fungrim
// entries (thousands of them, straight from the engine's compiled artifact, and the symbol
// page already proves the host is up), and OEIS and Britannica (behind bot challenges a
// script cannot pass; OEIS A-numbers are checked for shape, Britannica ids come from Wikidata).

import { COLLECTIONS, MAPS, STATS } from "@enumeratio/catalog";
import { CURATED } from "../src/crosswalk/curated-data.ts";
import { crosswalkFor } from "../src/crosswalk/index.ts";
import { isInventorySystem } from "../src/crosswalk/inventory.ts";
import type { CrosswalkSystem } from "../src/crosswalk/sources.ts";
import { engineSymbols } from "../src/engine-symbols-data.ts";
import { referenceEntries } from "../src/node.ts";

const entries = referenceEntries();

const args = process.argv.slice(2);
const option = (flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = option("--only")?.split(",") as CrosswalkSystem[] | undefined;
const head = option("--head");
const SKIPPED: readonly CrosswalkSystem[] = ["fungrimEntry", "oeis", "britannica"];

const names = head
  ? [head]
  : [
      ...new Set([
        ...entries.map((e) => e.name),
        ...engineSymbols.map((s) => s.name),
        ...Object.keys(CURATED),
        ...COLLECTIONS.map((c) => c.name),
        ...STATS.map((s) => s.name),
        ...MAPS.map((m) => m.name),
      ]),
    ].toSorted();

// One request per distinct URL, remembering who asked. A Python reference with no link is
// a name the system's documentation index does not carry -- worth a line, not a failure.
const targets = new Map<string, Set<string>>();
const unindexed: string[] = [];
for (const name of names) {
  const entry = entries.find((e) => e.name === name);
  for (const reference of crosswalkFor(name, entry)) {
    if (!reference.href) {
      if (isInventorySystem(reference.system)) {
        unindexed.push(`${name}: ${reference.system} ${reference.identity}`);
      }
      continue;
    }
    if (reference.system === "oeis" && !/^A\d{6}$/.test(reference.identity)) {
      process.stdout.write(`malformed OEIS id ${reference.identity} ← ${name}\n`);
    }
    if (only ? !only.includes(reference.system) : SKIPPED.includes(reference.system)) continue;
    const who = targets.get(reference.href) ?? new Set<string>();
    who.add(name);
    targets.set(reference.href, who);
  }
}

// A browser's user agent: OEIS sits behind a bot check that 403s a bare fetch.
const headers = {
  "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36",
};

// A host that never answers would stall the run, so each request has a deadline; one that
// passes it is reported apart from the links that answered with an error.
const REQUEST_TIMEOUT_MS = 15_000;
const TIMED_OUT = "timed out";

const probe = async (url: string, attempt = 0): Promise<number | typeof TIMED_OUT> => {
  try {
    // HEAD first; a few hosts answer HEAD with 405 and GET with 200.
    const request = (method: string) =>
      fetch(url, { method, redirect: "follow", headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    let response = await request("HEAD");
    if (response.status >= 400) response = await request("GET");
    // Rate limiting and a gateway hiccup are the checker's fault, not the link's.
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 3000 * 2 ** attempt));
      return probe(url, attempt + 1);
    }
    return response.status;
  } catch (error) {
    if ((error as Error).name === "TimeoutError") return TIMED_OUT;
    if (attempt >= 2) throw error;
    await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
    return probe(url, attempt + 1);
  }
};

// Hosts in parallel, and at most PER_HOST requests to any one site at once (Wikipedia carries most
// of the links, so one stream per host would leave it the whole run).
const STREAMS = 16;
const PER_HOST = 3;
const urls = [...targets.keys()];
const byHost = new Map<string, string[][]>();
for (const [i, url] of urls.entries()) {
  const host = new URL(url).host;
  const streams = byHost.get(host) ?? Array.from({ length: PER_HOST }, () => []);
  streams[i % PER_HOST]!.push(url);
  byHost.set(host, streams);
}
const bad: { url: string; status: number | string; who: string[] }[] = [];
const timedOut: string[] = [];
let done = 0;
const checkHost = async (hostUrls: string[]) => {
  for (const url of hostUrls) {
    const status = await probe(url).catch((error: Error) => error.message);
    if (status === TIMED_OUT) timedOut.push(url);
    else if (!(typeof status === "number" && status >= 200 && status < 300)) {
      bad.push({ url, status, who: [...targets.get(url)!].toSorted() });
    }
    if (++done % 100 === 0) process.stdout.write(`${done}/${urls.length} checked\n`);
  }
};
const queue = [...byHost.values()].flat().filter((stream) => stream.length);
await Promise.all(
  Array.from({ length: STREAMS }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) await checkHost(next);
  }),
);
// A small site (FindStat) times out under even PER_HOST requests at once and answers one in a second,
// so what timed out is asked again one at a time.
const slow = timedOut.splice(0);
done = urls.length - slow.length;
await checkHost(slow);

if (unindexed.length && !only) {
  process.stdout.write(`not in any documentation index:\n  ${unindexed.join("\n  ")}\n`);
}
for (const { url, status, who } of bad.toSorted((x, y) => x.url.localeCompare(y.url))) {
  process.stdout.write(`${status}  ${url}  ← ${who.join(", ")}\n`);
}
if (timedOut.length)
  process.stdout.write(`no answer within ${REQUEST_TIMEOUT_MS / 1000} s:\n  ${timedOut.toSorted().join("\n  ")}\n`);
process.stdout.write(`${urls.length} links checked, ${bad.length} not resolving, ${timedOut.length} timed out\n`);
process.exitCode = bad.length ? 1 : 0;
