// The partition families defined in Epsil: each lists its partitions largest part first, a part
// never above the one before it, as a walk (collections/src/families/part-walk.ts) over the sum
// left and a cap on the next part. A family's restrictions are what the walk allows: parts from a
// set, distinct parts, a number of parts, a cap, a largest part. Their TS kernels (core.ts,
// partitions.ts) stay as the `fast` paths, held to these by tests/fast-kernels.test.ts.
//
// The walk's table is n² cells of n terms each: fine while a count is a double, but partition
// counts reach 2^53 only around n = 300, where the interpreter's exact integers would take
// minutes. So past 2^53 unrank, rank and the interpreter decline (unknown); the count stays exact
// through the `fast` count (exact-classes.ts). IntegerPartitions alone answers there, from a
// BigInt table built with a recurrence (a cell is one addition), up to a table size.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import { partSets, partWalk, type PartWalk } from "../../../collections/src/families/part-walk.ts";
import { add, equal, iff, mul, quotient, sub } from "../../../collections/src/families/tables.ts";

type MathJSON = unknown;

const n = "_n";
const m = "_m";
const k = "_k";
const cap = add(n, 1);

/** Largest n whose partition table (n² cells) the BigInt path builds; the table of 1,000 is a million cells. */
const INTEGER_PARTITIONS_TABLE_LIMIT = 1000;

/** The walk's family, declining past 2^53. */
const walk = (spec: Omit<PartWalk, "carrier" | "order" | "total">): EpsilFamily => ({
  ...partWalk({ carrier: "IntegerPartition", order: "largest first", total: n, ...spec }),
  declinePastDoubles: "count",
});

/** The head's partitions of n, the next part never above the last: cap n at first, and p after part p. */
const capped = (head: string, allows?: (p: MathJSON) => MathJSON): EpsilFamily =>
  walk({
    head,
    paramCount: 1,
    params: [n],
    width: cap,
    start: n,
    limit: (c) => c,
    next: (_c, p) => p,
    ...(allows === undefined ? {} : { allows: (_c, p) => allows(p) }),
  });

/** Partitions of n into parts at most c: T(m, c) = T(m, c − 1) + T(m − c, c), the count with a part c or without. The
 *  walk's table is built over BigInts, n² cells, so a table past `INTEGER_PARTITIONS_TABLE_LIMIT` declines as before. */
export const integerPartitions: EpsilFamily = {
  ...walk({
    head: "IntegerPartitions",
    paramCount: 1,
    params: [n],
    width: cap,
    start: n,
    limit: (c) => c,
    next: (_c, p) => p,
    recurrence: (read, here, m, c) =>
      iff(equal(c, 0), 0, add(here(sub(c, 1)), iff(["LessEqual", c, m], read(sub(m, c), c), 0))),
  }),
  // p(n) first passes 2^53 at n = 300.
  bigSamples: [[300], [400]],
  declinePastDoubles: true,
  bigLimit: ([size]) => size > INTEGER_PARTITIONS_TABLE_LIMIT,
};

/** Parts all different: after part p the next is at most p − 1. */
export const distinctPartitions = walk({
  head: "DistinctPartitions",
  paramCount: 1,
  params: [n],
  width: cap,
  start: n,
  limit: (c) => c,
  next: (_c, p) => sub(p, 1),
});

/** Every part at most m: the cap starts at m (or n, which no part passes). */
export const partitionsMaxPart = walk({
  head: "PartitionsMaxPart",
  paramCount: 2,
  params: [n, m],
  width: cap,
  start: ["Min", m, n],
  limit: (c) => c,
  next: (_c, p) => p,
});

// More than n parts can't be placed, so k past n + 1 stands for n + 1.
const parts = ["Min", k, cap];

/** Exactly k parts: the context holds the parts to go (c div (n + 1)) and the cap (c mod (n + 1)). */
export const partitionsIntoKParts = walk({
  head: "PartitionsIntoKParts",
  paramCount: 2,
  params: [n, k],
  width: mul(add(parts, 1), cap),
  start: add(mul(parts, cap), n),
  ends: (c) => equal(quotient(c, cap), 0),
  limit: (c) => ["Mod", c, cap],
  allows: (c) => ["GreaterEqual", quotient(c, cap), 1],
  next: (c, p) => add(mul(sub(quotient(c, cap), 1), cap), p),
});

/** Largest part exactly m (m ≥ 1): the context is 1 until that part is placed, times n + 1, plus the cap. */
export const largestPartPartitions = walk({
  head: "LargestPartPartitions",
  paramCount: 2,
  params: [n, m],
  width: mul(2, cap),
  start: add(iff(["GreaterEqual", m, 1], cap, 0), ["Min", m, n]),
  ends: (c) => equal(quotient(c, cap), 0),
  limit: (c) => ["Mod", c, cap],
  allows: (c, p) => ["Or", equal(quotient(c, cap), 0), equal(p, m)],
  next: (_c, p) => p,
});

export const oddPartitions = capped("OddPartitions", partSets.odd);
export const primePartitions = capped("PrimePartitions", partSets.prime);
export const squarePartitions = capped("SquarePartitions", partSets.square);
export const triangularPartitions = capped("TriangularPartitions", partSets.triangular);
