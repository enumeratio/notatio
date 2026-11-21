// CorePartitions(t, n) in Epsil: the t-cores of n, the partitions of n with no hook length divisible
// by t, in IntegerPartitions' order (largest part first, reverse lexicographic). A partition is a
// t-core for many t at once, so t is a parameter of the collection and the carrier holds none.
//
// The hook of the cell in row i, column j is λᵢ − j + λ'ⱼ − i + 1, λ'ⱼ the number of parts of at
// least j. Whether a partition passes is no walk over its parts (a hook reads the whole diagram), so
// the family is IntegerPartitions(n) filtered: `_tables` is IntegerPartitions' own table followed by
// the ranks, in that family, of the members that pass. A core's place is then how many of those
// ranks lie below its own, and the core at a place is the partition of the rank stored there.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import type { Declared } from "../../../collections/src/families/types.ts";
import { PartitionsP } from "../../../collections/src/families/kernels-combinatorics.ts";
import { add, all, at, fold, iff, less, lets, mul, sub, upTo } from "../../../collections/src/families/tables.ts";
import { integerPartitions } from "./walks.ts";

type MathJSON = unknown;

const t = "_t";
const n = "_n";

/** The expression with every leaf name in `names` replaced by its value. */
const substitute = (expression: MathJSON, names: Readonly<Record<string, MathJSON>>): MathJSON => {
  if (typeof expression === "string") return Object.hasOwn(names, expression) ? names[expression] : expression;
  if (Array.isArray(expression)) return expression.map((part) => substitute(part, names));
  return expression;
};

const partitions = integerPartitions.epsil;
/** IntegerPartitions' table: (n + 1)² cells, whose last is p(n). */
const tableSize = mul(add(n, 1), add(n, 1));
const tableCount = at("_tables", tableSize);
const placeOf = (index: MathJSON): MathJSON => at("_tables", add(tableSize, index));
/** How many partitions of n have no hook divisible by t. */
const coreCount = sub(["Length", "_tables"], tableSize);

/** The number of parts of `parts` that are at least `column`: the length of that column of its diagram. */
const columnLength = (parts: MathJSON, column: MathJSON): MathJSON =>
  fold(
    add("cc_s", iff(["GreaterEqual", at(parts, "cc_k"), column], 1, 0)),
    "cc_s",
    "cc_k",
    0,
    upTo(1, ["Length", parts]),
  );

/** No cell of `parts` has a hook length divisible by t. */
const noHookDivisible = (parts: MathJSON): MathJSON =>
  all(
    (i) =>
      all(
        (j) => ["NotEqual", ["Mod", add(sub(at(parts, i), j), columnLength(parts, j), sub(1, i)), t], 0],
        upTo(1, at(parts, i)),
        "hj",
      ),
    upTo(1, ["Length", parts]),
    "hi",
  );

/** The partition at rank `rank` of IntegerPartitions(n), read from `tables`. */
const partitionAt = (rank: MathJSON, tables: MathJSON): MathJSON =>
  substitute(partitions.unrank, { _r: rank, _tables: tables });

const coreRanks = lets(
  [["cr_tables", partitions.tables, "list<integer>"]],
  [
    "Join",
    "cr_tables",
    [
      "Filter",
      [
        "Map",
        ["Function", iff(noHookDivisible(partitionAt("cr_r", "cr_tables")), "cr_r", -1), "cr_r"],
        upTo(0, sub(substitute(tableCount, { _tables: "cr_tables" }), 1)),
      ],
      ["Function", ["GreaterEqual", "cr_q", 0], "cr_q"],
    ],
  ],
);

/** Every call filters the p(n) partitions of n: the table unranks each once, and a call then reads it. */
const declared: Declared = {
  carrier: "CorePartition",
  params: [
    { name: "t", role: "param", min: 1 },
    { name: "n", role: "axis", min: 0 },
  ],
  cost: { count: "enumerative", unrank: "enumerative", rank: "enumerative", valid: "polynomial" },
  work: ([, size]) => {
    const members = PartitionsP(size as number);
    return Number.isFinite(members) ? BigInt(Math.round(members)) : 1n << 64n;
  },
};

export const corePartitions: EpsilFamily = {
  head: "CorePartitions",
  carrier: "CorePartition",
  paramCount: 2,
  kind: "ints",
  declared,
  params: [t, n],
  epsil: {
    tables: coreRanks,
    count: coreCount,
    unrank: lets([["cu_rank", placeOf(add("_r", 1))]], substitute(partitions.unrank, { _r: "cu_rank" })),
    // Ranks ascend, so a core's place is the number of passing ranks below its own.
    rank: lets(
      [["ck_rank", partitions.rank]],
      fold(add("ck_s", iff(less(placeOf("ck_j"), "ck_rank"), 1, 0)), "ck_s", "ck_j", 0, upTo(1, coreCount)),
    ),
    valid: ["And", partitions.valid, noHookDivisible("_x")],
  },
};
