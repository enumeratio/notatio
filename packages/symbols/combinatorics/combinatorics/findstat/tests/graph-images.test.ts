// The comparison a map check uses on graph images (../src/graph-images.ts), and the canonical form held to FindStat's own
// spellings: each graph the snapshot names canonicalizes to a member of UnlabeledGraphs, and with the crawl
// (DEEP_TESTS=1 and FINDSTAT_CRAWL, as distribution-crosscheck.test.ts) every spelling through 8 vertices does.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import { adjacencyOf, canonicalBlocks, canonicalRanks, positionOf } from "../../graphs/src/canonical.ts";
import { canonicalImage, graphImageOf, isomorphicImages } from "../src/graph-images.ts";
import { readObject } from "../src/objects.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const CRAWL = process.env.FINDSTAT_CRAWL;

interface Snapshot {
  readonly items: Readonly<Record<string, { collection: string; sample: readonly [string, number][] }>>;
}
const snapshot = JSON.parse(readFileSync(new URL("../data/statistics.json", import.meta.url), "utf8")) as Snapshot;

const cycle = (n: number) => ({
  vertices: n,
  edges: Array.from({ length: n }, (_, i) => [i + 1, ((i + 1) % n) + 1]),
});

test("two graph images are isomorphic when a relabeling joins them, past the vertex count a rank fits a double", () => {
  // 12 vertices: C(12, 2) = 66 bits, past 2^53. A 12-cycle against its relabeling by a step of 5, and against two 6-cycles.
  const twelve = cycle(12);
  const stepped = { vertices: 12, edges: twelve.edges.map(([u, v]) => [((u * 5) % 12) + 1, ((v * 5) % 12) + 1]) };
  const halves = {
    vertices: 12,
    edges: [...cycle(6).edges, ...cycle(6).edges.map(([u, v]) => [u + 6, v + 6])],
  };
  expect(isomorphicImages(twelve, stepped)).toBe(true);
  expect(isomorphicImages(twelve, halves)).toBe(false);
  // Edges in either order, and spelled as the maps give them.
  expect(isomorphicImages(twelve, { vertices: 12, edges: twelve.edges.map(([u, v]) => [v, u]).toReversed() })).toBe(
    true,
  );
  expect(isomorphicImages(cycle(5), { vertices: 6, edges: cycle(5).edges })).toBe(false);
  expect(canonicalImage(twelve)).toEqual(canonicalImage(stepped));
  // Too many vertices for the search: no answer.
  expect(isomorphicImages({ vertices: 31, edges: [] }, { vertices: 31, edges: [] })).toBeUndefined();
});

test("a graph image is read from the carrier value as FindStat's reader gives it, or the bare tuple", () => {
  const value = readObject("LabeledGraph", "([(0,1),(0,2),(1,2)],4)")!;
  expect(graphImageOf(value)).toEqual({
    vertices: 4,
    edges: [
      [1, 2],
      [1, 3],
      [2, 3],
    ],
  });
  expect(graphImageOf((value as unknown[])[1])).toEqual(graphImageOf(value));
  expect(graphImageOf(["Tuple", 2])).toBeUndefined();
  expect(graphImageOf("x")).toBeUndefined();
});

/** Whether the graph FindStat spells as `text` canonicalizes to a member of UnlabeledGraphs. */
function canonicalizesToMember(text: string): boolean {
  const image = graphImageOf(readObject("LabeledGraph", text))!;
  const blocks = canonicalBlocks(adjacencyOf(image.vertices, image.edges))!;
  let rank = 0;
  for (let a = image.vertices - 1; a >= 1; a--) rank = rank * 2 ** (image.vertices - a) + blocks[image.vertices - a];
  return positionOf(image.vertices, rank) >= 0;
}

test("every graph spelling in the snapshot canonicalizes to a member of UnlabeledGraphs", () => {
  const texts = new Set<string>();
  for (const entry of Object.values(snapshot.items))
    if (entry.collection === "Graphs") for (const [text] of entry.sample) texts.add(text);
  expect(texts.size).toBeGreaterThan(20);
  // The list for 8 vertices takes most of a second to build: the standard run reads through 7, DEEP_TESTS 8.
  const largest = DEEP ? 8 : 7;
  let read = 0;
  for (const text of texts) {
    const image = graphImageOf(readObject("LabeledGraph", text));
    if (image === undefined || image.vertices > largest) continue;
    expect([text, canonicalizesToMember(text)]).toEqual([text, true]);
    read++;
  }
  expect(read).toBeGreaterThan(20);
  expect(canonicalRanks(2)).toEqual([0, 1]);
});

test.skipIf(!DEEP || CRAWL === undefined || !existsSync(`${CRAWL}/St000001.json`))(
  "every graph spelling in the crawl, through 8 vertices, canonicalizes to a member of UnlabeledGraphs",
  () => {
    const texts = new Set<string>();
    for (const file of readdirSync(CRAWL!).filter((name) => /^St\d+\.json$/.test(name))) {
      const data = JSON.parse(readFileSync(`${CRAWL}/${file}`, "utf8")) as {
        Collection?: string;
        StatisticData?: Record<string, number>;
      };
      if (data.Collection !== undefined && !/Graphs/.test(data.Collection)) continue;
      for (const text of Object.keys(data.StatisticData ?? {}))
        if (/^\(\[.*\],\d+\)$/.test(text) && Number(/,(\d+)\)$/.exec(text)![1]) <= 8) texts.add(text);
    }
    for (const text of texts) expect([text, canonicalizesToMember(text)]).toEqual([text, true]);
  },
  600_000,
);
