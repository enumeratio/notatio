// Combinatorial maps whose `from` carrier is `integer_partition` (step 6c: the area owning the
// carrier owns the map). See `../../src/map-helpers.ts` for the generic pieces.

import {
  at,
  bind,
  descending,
  forEach,
  lets,
  type CombinatorialMap,
  type MathJSON,
  positions,
} from "../../src/map-helpers.ts";
import { twoConjugateBody } from "./two-conjugate.ts";

const parts: MathJSON = ["Length", "_raw"];
const upTo = (k: MathJSON): MathJSON => ["Range", 1, k, 1];
const zeros = (count: MathJSON): MathJSON => forEach(upTo(count), 0, "z");

/** Part i less part i + 1, the last part less nothing. */
const dropAfter = (i: MathJSON): MathJSON => ["Subtract", at(i), ["If", ["Equal", i, parts], 0, at(["Add", i, 1])]];

/** The Dyck path of the polyomino paths `lower` and `upper` (bound names, each of length n + 1), by the classical
 *  Delest-Viennot bijection: 1 - lower(1), then upper(i + 1) and 1 - lower(i + 1) alternating. */
const delestViennotPath = (lower: string, upper: string, steps: MathJSON): MathJSON =>
  forEach(upTo(steps), [
    "If",
    ["Equal", ["Mod", "i", 2], 1],
    ["Subtract", 1, at(["Divide", ["Add", "i", 1], 2], lower)],
    at(["Add", ["Divide", "i", 2], 1], upper),
  ]);

/** The multiplicity of the part p in `_raw`. */
const multiplicity = (p: MathJSON): MathJSON => ["Count", ["Filter", "_raw", ["Function", ["Equal", "x", p], "x"]]];

/** Bit k of the integer m. */
const bit = (m: MathJSON, k: MathJSON): MathJSON => ["Mod", ["Floor", ["Divide", m, ["Power", 2, k]]], 2];

/** The parts 1 .. largest, as the range to read multiplicities over. */
const sizes: MathJSON = upTo(["Max", "_raw"]);

/** A skew partition `_raw` is [outer, inner]: the outer partition, and the inner one, which may have fewer parts. */
const outer: MathJSON = at(1);
const inner: MathJSON = at(2);
const rowCount: MathJSON = ["Length", outer];
/** Row r of the inner partition, 0 below its last part. */
const innerRow = (r: MathJSON): MathJSON => ["If", ["LessEqual", r, ["Length", inner]], at(r, inner), 0];
/** The cells of row r. */
const rowLength = (r: MathJSON): MathJSON => ["Subtract", at(r, outer), innerRow(r)];

/** The conjugate of the partition `lambda`: entry j counts the parts that are at least j. */
const conjugateOf = (lambda: MathJSON): MathJSON => [
  "If",
  ["Equal", ["Length", lambda], 0],
  ["List"],
  forEach(
    upTo(["Max", lambda]),
    ["Max", ["Sum", forEach(lambda, ["If", ["GreaterEqual", "p", "j"], 1, 0], "p")], 0],
    "j",
  ),
];

/** The cells of each column of the skew shape, left to right: the rows whose cells reach that column. */
const columnLengths: MathJSON = forEach(
  upTo(["Max", outer]),
  [
    "Max",
    [
      "Sum",
      forEach(
        upTo(rowCount),
        ["If", ["And", ["GreaterEqual", "c", ["Add", innerRow("r"), 1]], ["LessEqual", "c", at("r", outer)]], 1, 0],
        "r",
      ),
    ],
    0,
  ],
  "c",
);

/** The inner shape of the rotated skew partition: the outer partition's complement in its first row, read upward. */
const rotatedInner: MathJSON = forEach(
  upTo(rowCount),
  ["Subtract", at(1, outer), at(["Subtract", ["Add", rowCount, 1], "r"], outer)],
  "r",
);

export const PARTITIONS_MAPS: readonly CombinatorialMap[] = [
  {
    name: "TransposePartition",
    from: "integer_partition",
    to: "integer_partition",
    // Column i of the diagram has as many cells as there are parts of at least i. The empty
    // partition is its own case: `Max` of no parts is not a bound for `Range`.
    body: [
      "If",
      ["Equal", ["Length", "_raw"], 0],
      ["List"],
      forEach(
        ["Range", 1, ["Max", "_raw"], 1],
        ["Count", ["Filter", "_raw", ["Function", ["GreaterEqual", "p", "i"], "p"]]],
      ),
    ],
    summary: "The conjugate partition: column i of the Ferrers diagram becomes row i.",
    note: "Entry i of the result counts the parts that are at least i, so it is its own inverse and swaps the number of parts with the largest part. Combinatorica's TransposePartition; FindStat's Mp00044, \"conjugate\". Wolfram's Conjugate is the complex conjugate, not this map.",
  },
  {
    name: "RemoveFirstPart",
    from: "integer_partition",
    to: "integer_partition",
    body: forEach(["Range", 2, ["Length", "_raw"], 1], at("i")),
    summary: "The partition without its largest part: its first row removed.",
    note: "FindStat's Mp00202. Lossy: the largest part is forgotten.",
  },
  {
    name: "BulgarianSolitaire",
    from: "integer_partition",
    to: "integer_partition",
    // Every part loses one cell (the first column), and the removed column becomes a part of its own.
    body: bind(
      "moved",
      ["Flatten", ["List", forEach(positions, ["Subtract", at("i"), 1]), ["List", ["Length", "_raw"]]]],
      ["Filter", descending("moved"), ["Function", ["Greater", "x", 0], "x"]],
      "list<integer>",
    ),
    summary: "A move of Bulgarian solitaire: the first column of the Ferrers diagram becomes a new row.",
    note: "FindStat's Mp00308. Not injective; the fixed points are the staircase partitions.",
  },
  {
    name: "BinaryWord",
    convert: true,
    from: "integer_partition",
    to: "binary_word",
    // The k-th row is a 1 after the p1 - pk lefts of the rows above it, so the 1s sit at positions p1 - pk + k.
    body: [
      "If",
      ["Equal", ["Length", "_raw"], 0],
      ["List"],
      forEach(
        ["Range", 1, ["Add", at(1), ["Length", "_raw"]], 1],
        ["If", ["Element", "t", forEach(positions, ["Add", ["Subtract", at(1), at("k")], "k"], "k")], 1, 0],
        "t",
      ),
    ],
    summary: "The shape's boundary read from the first row down: 1 for a step down, 0 for a step left.",
    note: "FindStat's Mp00095. Injective.",
    findstat: ["Mp00095"],
  },
  {
    name: "OddPartsWord",
    from: "integer_partition",
    to: "binary_word",
    body: forEach(positions, ["Mod", at("i"), 2]),
    summary: "The binary word marking which parts are odd, the parts taken largest first.",
    note: "FindStat's Mp00317. Lossy: only the parts' parity is kept.",
  },
  {
    name: "MinimalDyckPath",
    from: "integer_partition",
    to: "dyck_path",
    // n is the least semilength whose staircase holds the shape: max over rows of row + part. The path is n - (parts)
    // ups, then for each row from the last up the drop to the next row in downs and an up, then n - (first part) downs.
    body: [
      "If",
      ["Equal", parts, 0],
      ["List"],
      lets(
        [["md_n", ["Max", forEach(positions, ["Add", "i", at("i")])], "integer"]],
        [
          "Join",
          forEach(upTo(["Subtract", "md_n", parts]), 1, "z"),
          [
            "Flatten",
            forEach(positions, ["Join", zeros(dropAfter(["Subtract", ["Add", parts, 1], "i"])), ["List", 1]], "i"),
          ],
          zeros(["Subtract", "md_n", at(1)]),
        ],
      ),
    ],
    summary: "The shortest Dyck path tracing the shape of the Ferrers diagram.",
    note: "FindStat's Mp00043, Sage's partition to minimal Dyck word. Injective: the partition is the region above the path, and this is the shortest path whose region it is.",
  },
  {
    name: "ParallelogramPolyominoDyckPath",
    from: "integer_partition",
    to: "dyck_path",
    // The Ferrers diagram as a parallelogram polyomino, a column per part: lower path first-part rights then one up
    // per part, upper path an up and the drop to the next part in rights for each part.
    body: [
      "If",
      ["Equal", parts, 0],
      ["List"],
      lets(
        [
          ["pp_lower", ["Flatten", ["List", zeros(at(1)), forEach(positions, 1, "z")]], "list<integer>"],
          [
            "pp_upper",
            ["Flatten", forEach(positions, ["Join", ["List", 1], zeros(dropAfter("i"))], "i")],
            "list<integer>",
          ],
        ],
        delestViennotPath("pp_lower", "pp_upper", ["Multiply", 2, ["Add", at(1), ["Subtract", parts, 1]]]),
      ),
    ],
    summary: "The Dyck path of the partition read as a parallelogram polyomino, one column per part.",
    note: "FindStat's Mp00230. Injective.",
  },
  {
    name: "InitialTableau",
    from: "integer_partition",
    to: "standard_tableau",
    body: forEach(
      positions,
      forEach(
        upTo(at("i")),
        ["Add", "k", ["Fold", ["Function", ["Add", "acc", at("j")], "acc", "j"], 0, upTo(["Subtract", "i", 1])]],
        "k",
      ),
    ),
    summary: "The standard tableau of the shape filled row by row with 1, 2, ..., n.",
    note: "FindStat's Mp00042. Injective.",
  },
  {
    name: "ReadingTableau",
    from: "integer_partition",
    to: "standard_tableau",
    composedOf: ["RskRecording", "ReadingWord", "InitialTableau"],
    summary: "The recording tableau of the row reading word of the shape filled row by row.",
    note: "FindStat's Mp00045. Injective. The RSK insertion tableau of that word is the filled shape again, so this is the other half of its pair.",
  },
  {
    name: "GlaisherFranklin",
    from: "integer_partition",
    to: "integer_partition",
    // Even parts p of multiplicity m become 2m parts p/2; an odd part p of multiplicity m becomes the parts p 2^k for
    // each binary digit k of m.
    body: bind(
      "gf",
      [
        "If",
        ["Equal", parts, 0],
        ["List"],
        [
          "Flatten",
          forEach(
            sizes,
            [
              "If",
              ["Equal", ["Mod", "p", 2], 0],
              forEach(upTo(["Multiply", 2, multiplicity("p")]), ["Divide", "p", 2], "z"),
              [
                "Flatten",
                forEach(
                  ["Range", 0, ["Count", "_raw"], 1],
                  [
                    "If",
                    ["Equal", bit(multiplicity("p"), "k"), 1],
                    ["List", ["Multiply", "p", ["Power", 2, "k"]]],
                    ["List"],
                  ],
                  "k",
                ),
              ],
            ],
            "p",
          ),
        ],
      ],
      descending("gf"),
      "list<integer>",
    ),
    summary:
      "The Glaisher-Franklin bijection: even part sizes halved become repeated parts, and repeated odd parts merge into their binary multiples.",
    note: "FindStat's Mp00312. It sends the set of even part sizes, each halved, to the set of repeated part sizes.",
  },
  {
    name: "InverseGlaisherFranklin",
    from: "integer_partition",
    to: "integer_partition",
    // A part p repeated m times: floor(m / 2) parts 2p, and when m is odd one more p, split while even into 2^v copies
    // of the odd part p / 2^v.
    body: [
      "If",
      ["Equal", parts, 0],
      ["List"],
      lets(
        [
          ["gi_count", forEach(sizes, multiplicity("p"), "p"), "list<integer>"],
          [
            "gi_twos",
            forEach(
              sizes,
              [
                "Count",
                ["Filter", upTo(["Min", "p", 50]), ["Function", ["Equal", ["Mod", "p", ["Power", 2, "e"]], 0], "e"]],
              ],
              "p",
            ),
            "list<integer>",
          ],
          [
            "gi_all",
            [
              "Flatten",
              forEach(
                sizes,
                [
                  "Flatten",
                  [
                    "List",
                    forEach(upTo(["Floor", ["Divide", at("p", "gi_count"), 2]]), ["Multiply", 2, "p"], "z"),
                    forEach(
                      upTo(["If", ["Equal", ["Mod", at("p", "gi_count"), 2], 1], ["Power", 2, at("p", "gi_twos")], 0]),
                      ["Divide", "p", ["Power", 2, at("p", "gi_twos")]],
                      "z",
                    ),
                  ],
                ],
                "p",
              ),
            ],
            "list<integer>",
          ],
        ],
        descending("gi_all"),
      ),
    ],
    summary:
      "The inverse of GlaisherFranklin: repeated parts merge into doubled parts, and a leftover part splits into copies of its odd part.",
    note: "FindStat's Mp00313. It sends the number of distinct repeated part sizes to the number of distinct even part sizes.",
  },
  {
    name: "OuterShape",
    from: "skew_partition",
    to: "integer_partition",
    body: outer,
    summary: "The outer partition λ of the skew shape λ/μ.",
    note: "FindStat's Mp00182.",
  },
  {
    name: "InnerShape",
    from: "skew_partition",
    to: "integer_partition",
    body: inner,
    summary: "The inner partition μ of the skew shape λ/μ.",
    note: "FindStat's Mp00183.",
  },
  {
    name: "DominatingPartition",
    from: "skew_partition",
    to: "integer_partition",
    // The conjugate of the sorted column lengths is the conjugate of their multiset, which needs no sorting.
    body: ["If", ["Equal", rowCount, 0], ["List"], conjugateOf(columnLengths)],
    summary:
      "The largest partition in dominance order in the Schur expansion of the skew Schur function: the conjugate of the column lengths, sorted.",
    note: "FindStat's Mp00186 (Lam, Postnikov and Pylyavskyy).",
  },
  {
    name: "RowLengths",
    from: "skew_partition",
    to: "composition",
    body: ["If", ["Equal", rowCount, 0], ["List"], forEach(upTo(rowCount), rowLength("r"), "r")],
    summary: "The number of cells in each row, from the top.",
    note: "FindStat's Mp00181. Every row of a skew shape has a cell, so these are the parts of a composition.",
  },
  {
    name: "TransposeSkewPartition",
    from: "skew_partition",
    to: "skew_partition",
    body: ["List", conjugateOf(outer), conjugateOf(inner)],
    summary: "The conjugate skew shape: rows become columns.",
    note: "FindStat's Mp00187, an involution: λ/μ becomes λ'/μ'.",
  },
  {
    name: "RotateSkewPartition",
    from: "skew_partition",
    to: "skew_partition",
    // The half turn takes row r to row n + 1 - r and the cells (i, j) to (n + 1 - i, w + 1 - j), for w the first part of λ.
    body: [
      "If",
      ["Equal", rowCount, 0],
      ["List", ["List"], ["List"]],
      [
        "List",
        forEach(
          upTo(rowCount),
          ["Add", at("r", rotatedInner), rowLength(["Subtract", ["Add", rowCount, 1], "r"])],
          "r",
        ),
        ["Filter", rotatedInner, ["Function", ["Greater", "x", 0], "x"]],
      ],
    ],
    summary: "The shape turned half way around: the rotation of the diagram by 180 degrees.",
    note: "FindStat's Mp00189, an involution.",
  },
  {
    name: "SkewPartition",
    convert: true,
    from: "integer_partition",
    to: "skew_partition",
    body: ["List", "_raw", ["List"]],
    summary: "The partition as the skew shape λ/∅.",
    note: "FindStat's Mp00179. Injective.",
    findstat: ["Mp00179"],
  },
  {
    name: "TwoConjugate",
    from: "integer_partition",
    to: "integer_partition",
    body: twoConjugateBody,
    summary:
      "The involution that keeps the odd parts' positions and swaps the number of even parts with the number of cells of zero leg length and odd arm length.",
    note: "FindStat's Mp00321, a bijection and an involution: the remainder diagram of the partition mod 2, taken through the green and yellow construction, conjugated and taken back.",
  },
];
