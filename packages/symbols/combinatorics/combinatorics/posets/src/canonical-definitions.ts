// The canonical form of a naturally labeled poset and the collection of posets up to isomorphism, in Epsil: the meaning
// the kernel in ./canonical.ts is held to. A value is its list of lower covers; its code is the rank of its comparability
// graph in `LabeledGraphs(n)` (pair (a, b), a < b, is bit offset(a) + b − a − 1, set when a is below b). The canonical
// form is the natural labeling with the least code: the least code over the natural relabelings, read off a table of
// every permutation of 1..n.

import {
  add,
  and,
  at,
  choose,
  equal,
  fold,
  iff,
  less,
  lets,
  map,
  mul,
  quotient,
  sub,
  upTo,
} from "../../collections/src/families/tables.ts";
import { strictOrderOf } from "./statistics.ts";

type MathJSON = unknown;

const list = (...xs: MathJSON[]): MathJSON => ["List", ...xs];
const pow2 = (exponent: MathJSON): MathJSON => ["Power", 2, exponent];
/** The sum of `body` over `over`, floored at 0 so the compiler types it real; the sums here count. */
const total = (body: MathJSON, variable: string, over: MathJSON): MathJSON => [
  "Max",
  ["Sum", map(body, variable, over)],
  0,
];
const filter = (over: MathJSON, test: MathJSON, variable: string): MathJSON => [
  "Filter",
  over,
  ["Function", test, variable],
];
const not = (test: MathJSON): MathJSON => ["Not", test];

/** The bit of the pair (a, b), a < b, in a code of n elements: the pairs of the rows before a, then b − a − 1 more. */
const exponent = (n: MathJSON, a: MathJSON, b: MathJSON): MathJSON =>
  sub(add(sub(choose(n, 2), choose(add(sub(n, a), 1), 2)), sub(b, a)), 1);

/** 1 when x is below y in the order whose code is `code`. */
const codeBelow =
  (n: MathJSON, code: MathJSON) =>
  (x: MathJSON, y: MathJSON): MathJSON =>
    iff(less(x, y), ["Mod", quotient(code, pow2(exponent(n, x, y))), 2], 0);

/** 1 when x is below y in the order held as a flat n × n list `matrix`, entry (y − 1) n + x. */
const matrixBelow =
  (n: MathJSON, matrix: MathJSON) =>
  (x: MathJSON, y: MathJSON): MathJSON =>
    at(matrix, add(mul(sub(y, 1), n), x));

type Relation = (x: MathJSON, y: MathJSON) => MathJSON;

/** The code of the order `below` over the labels it is read through. */
const codeUnder = (n: MathJSON, below: Relation, tag: string): MathJSON => {
  const [i, j] = [`${tag}_i`, `${tag}_j`];
  return total(total(mul(below(i, j), pow2(exponent(n, i, j))), j, upTo(add(i, 1), n)), i, upTo(1, sub(n, 1)));
};

/** Whether the labeling reads the order as natural: nothing with a smaller label lies above something with a larger one. */
const isNatural = (n: MathJSON, below: Relation, tag: string): MathJSON => {
  const [i, j] = [`${tag}_i`, `${tag}_j`];
  return equal(total(total(below(j, i), j, upTo(add(i, 1), n)), i, upTo(1, sub(n, 1))), 0);
};

/** Whether the relation is transitive. */
const isTransitive = (n: MathJSON, below: Relation, tag: string): MathJSON => {
  const [a, b, c] = [`${tag}_a`, `${tag}_b`, `${tag}_c`];
  return equal(
    total(
      total(total(mul(below(a, b), below(b, c), sub(1, below(a, c))), c, upTo(1, n)), b, upTo(1, n)),
      a,
      upTo(1, n),
    ),
    0,
  );
};

/** The lower covers, row by row, of the order read through `below` over labels 1..n. */
const lowerCovers = (n: MathJSON, below: Relation, tag: string): MathJSON => {
  const [row, a, k] = [`${tag}_b`, `${tag}_a`, `${tag}_k`];
  const cover = and(
    less(a, row),
    equal(below(a, row), 1),
    equal(total(mul(below(a, k), below(k, row)), k, upTo(1, n)), 0),
  );
  return map(filter(upTo(1, n), cover, a), row, upTo(1, n));
};

/**
 * A flat list of every permutation of 1..n, n entries each: the permutations of 1..k are those of 1..k − 1 with k
 * put in each of the k places.
 */
export const permutationTable = (n: MathJSON): MathJSON => {
  const [table, k, grown, t, m] = ["pt_a", "pt_k", "pt_b", "pt_t", "pt_m"];
  const [old, place] = [quotient(t, k), add(["Mod", t, k], 1)];
  const entry = iff(
    less(m, place),
    at(table, add(mul(old, sub(k, 1)), m)),
    iff(equal(m, place), k, at(table, add(mul(old, sub(k, 1)), sub(m, 1)))),
  );
  const count = mul(quotient(["Length", table], sub(k, 1)), k);
  const insert = fold(
    ["Join", grown, map(entry, m, upTo(1, k))],
    grown,
    t,
    list(),
    upTo(0, sub(count, 1)),
    "list<integer>",
  );
  return fold(insert, table, k, list(1), upTo(2, n), "list<integer>");
};

/** The permutation count read from a table of them. */
const permutationCount = (n: MathJSON, table: MathJSON): MathJSON => quotient(["Length", table], n);

/** For each permutation, the code of the order relabeled by it when that labeling is natural, else more than any code. */
const relabeledCodes = (n: MathJSON, below: Relation, table: MathJSON, tag: string): MathJSON => {
  const t = `${tag}_t`;
  const labeled: Relation = (x, y) => below(at(table, add(mul(t, n), x)), at(table, add(mul(t, n), y)));
  return map(
    iff(isNatural(n, labeled, `${tag}n`), codeUnder(n, labeled, `${tag}c`), pow2(choose(n, 2))),
    t,
    upTo(0, sub(permutationCount(n, table), 1)),
  );
};

// ─── CanonicalPoset(P): the natural labeling with the least code ───────────────────────────────────────────────────────

/** The poset in `_raw` with n at least 2 relabeled by the first natural permutation of least code. */
export const canonicalPosetBody: MathJSON = iff(
  less(["Length", "_raw"], 2),
  "_raw",
  lets(
    [
      ["cn", ["Length", "_raw"], "integer"],
      ["n", "cn", "integer"],
      ["below", strictOrderOf("_raw"), "list<integer>"],
      ["cp", permutationTable("cn"), "list<integer>"],
      ["cs", relabeledCodes("cn", matrixBelow("cn", "below"), "cp", "cs"), "list<integer>"],
      [
        "ct",
        at(
          filter(upTo(0, sub(permutationCount("cn", "cp"), 1)), equal(at("cs", add("cf", 1)), ["Min", "cs"]), "cf"),
          1,
        ),
        "integer",
      ],
    ],
    lowerCovers(
      "cn",
      (x, y) => matrixBelow("cn", "below")(at("cp", add(mul("ct", "cn"), x)), at("cp", add(mul("ct", "cn"), y))),
      "cv",
    ),
  ),
);

// ─── Posets(n): the codes below 2^C(n, 2) that are a strict order and their own canonical code, ascending ──────────────

const n: MathJSON = "_n";
const codes: MathJSON = upTo(0, sub(pow2(choose(n, 2)), 1));

/** Whether `code` is the code of a strict order that is its own canonical code. */
const isMember = (code: MathJSON, tag: string): MathJSON => {
  const below = codeBelow(n, code);
  return and(isTransitive(n, below, `${tag}o`), equal(["Min", relabeledCodes(n, below, "_tables", `${tag}r`)], code));
};

/** The code of the order held in `matrix` (a flat n × n list, `below(x, y)` at (y − 1) n + x). */
const codeOfMatrix = (matrix: MathJSON): MathJSON => {
  const below = matrixBelow(n, matrix);
  return total(
    total(mul(below("xa", "xb"), pow2(exponent(n, "xa", "xb"))), "xb", upTo(add("xa", 1), n)),
    "xa",
    upTo(1, sub(n, 1)),
  );
};

const row = (i: MathJSON): MathJSON => at("_x", i);
const entry = (i: MathJSON, k: MathJSON): MathJSON => at(row(i), k);

/** Whether `_x` lists, for each element i, ascending integers in 1..i − 1. */
const shaped: MathJSON = (() => {
  const [i, k] = ["sp_i", "sp_k"];
  const e = entry(i, k);
  const cell = and(["LessEqual", 1, e], less(e, i), iff(equal(k, 1), "True", less(entry(i, sub(k, 1)), e)));
  const rowOk = fold(and("sp_ok", iff(less(["Length", row(i)], k), "True", cell)), "sp_ok", k, "True", upTo(1, n));
  return fold(and("sp_all", rowOk), "sp_all", i, "True", upTo(1, n));
})();

/** Whether no cover of an element lies below another: `_x` is transitively reduced. */
const reduced: MathJSON = (() => {
  const [i, k, l] = ["rd_i", "rd_k", "rd_l"];
  const covered = iff(
    and(less(k, l), ["LessEqual", l, ["Length", row(i)]]),
    matrixBelow(n, "below")(entry(i, k), entry(i, l)),
    0,
  );
  return equal(total(total(total(covered, l, upTo(1, n)), k, upTo(1, n)), i, upTo(1, n)), 0);
})();

export const posetsDefinitions = {
  tables: iff(less(n, 2), list(1), permutationTable(n)),
  count: iff(less(n, 2), 1, total(iff(isMember("rc", "mc"), 1, 0), "rc", codes)),
  unrank: iff(
    less(n, 2),
    iff(equal(n, 0), list(), list(list())),
    lets(
      [["uc", at(filter(codes, isMember("uf", "mu"), "uf"), add("_r", 1)), "integer"]],
      lowerCovers(n, codeBelow(n, "uc"), "uv"),
    ),
  ),
  rank: iff(
    less(n, 2),
    0,
    lets(
      [
        ["n", n, "integer"],
        ["below", strictOrderOf("_x"), "list<integer>"],
        ["xc", codeOfMatrix("below"), "integer"],
      ],
      total(iff(and(less("rk", "xc"), isMember("rk", "mr")), 1, 0), "rk", codes),
    ),
  ),
  valid: iff(
    not(equal(["Length", "_x"], n)),
    "False",
    iff(
      equal(n, 0),
      "True",
      iff(
        not(shaped),
        "False",
        iff(
          equal(n, 1),
          "True",
          lets(
            [
              ["n", n, "integer"],
              ["below", strictOrderOf("_x"), "list<integer>"],
              ["xc", codeOfMatrix("below"), "integer"],
            ],
            and(reduced, isMember("xc", "mv")),
          ),
        ),
      ),
    ),
  ),
};
