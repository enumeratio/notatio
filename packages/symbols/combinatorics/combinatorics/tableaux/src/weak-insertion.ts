// Row insertion of a word with repeated letters (weak bumping), as an Epsil fold over flat integer lists, and the
// insertion tableau it gives. `flat.ts` does the same for a permutation, where every letter is distinct.
//
// The state is the n row lengths followed by the insertion tableau's n * n cells, row r at offset (r - 1) * n, zero
// past a row's end. Entries are positive; a zero is "no entry".
//
// An insertion bumps one entry down each row it passes: the leftmost entry strictly larger than the entering one
// (one more than the number of entries at most it), or none, when the letter ends the row. That chain is found
// first, on the state as it was, and then every cell is written once.

import { fold as typedFold } from "../../collections/src/families/tables.ts";
import { lets, type MathJSON } from "../../src/map-helpers.ts";

const fold = (...args: Parameters<typeof typedFold>): MathJSON => typedFold(...args) as MathJSON;
/** Entry `index` of `list`. */
const at = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];
const upTo = (n: MathJSON): MathJSON => ["Range", 1, n, 1];
const add = (...terms: MathJSON[]): MathJSON => ["Add", ...terms];
const sub = (a: MathJSON, b: MathJSON): MathJSON => ["Subtract", a, b];
const times = (a: MathJSON, b: MathJSON): MathJSON => ["Multiply", a, b];
const equal = (a: MathJSON, b: MathJSON): MathJSON => ["Equal", a, b];
const when = (condition: MathJSON, then: MathJSON, otherwise: MathJSON): MathJSON => ["If", condition, then, otherwise];
const keep = (over: MathJSON, test: MathJSON, variable: string): MathJSON => [
  "Filter",
  over,
  ["Function", test, variable],
];
const forEach = (over: MathJSON, body: MathJSON, variable: string): MathJSON => [
  "Map",
  ["Function", body, variable],
  over,
];
/** `forEach` as a fold: a state must be a list, not a lazy `Map` over a range. */
const built = (over: MathJSON, body: MathJSON, variable: string): MathJSON =>
  fold(["Join", `${variable}_built`, ["List", body]], `${variable}_built`, variable, ["List"], over);

/** The cell (`row`, `column`) of the layout of `n` cells a row, after `before` leading entries. */
const cell = (state: MathJSON, n: MathJSON, before: MathJSON, row: MathJSON, column: MathJSON): MathJSON =>
  at(state, add(before, times(sub(row, 1), n), column));

/** The state after row-inserting each letter of the bound name `word` (a `list<integer>`) in turn; `tag` prefixes the names. */
const weakState = (tag: string, word: string): MathJSON => {
  const [n, nn, s, k, j, q, c, acc, rowOf, colOf, chain, v, l, p] = [
    "n",
    "nn",
    "s",
    "k",
    "j",
    "q",
    "c",
    "acc",
    "row",
    "col",
    "chain",
    "v",
    "l",
    "p",
  ].map((key) => `${tag}_${key}`) as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  const entering = (row: MathJSON): MathJSON => at(chain, sub(times(2, row), 1));
  const landing = (row: MathJSON): MathJSON => at(chain, times(2, row));
  const length = (row: MathJSON): MathJSON => at(s, row);
  const inserted = (row: MathJSON, column: MathJSON): MathJSON => cell(s, n, n, row, column);

  // Row q takes `entering(q)` in the place of its leftmost larger entry, which enters row q + 1; a zero enters no row.
  const chainStep: MathJSON = lets(
    [
      [v, at(acc, sub(times(2, q), 1)), "integer"],
      [l, length(q), "integer"],
      [p, when(equal(v, 0), 0, add(1, ["Count", keep(upTo(l), ["LessEqual", inserted(q, c), v], c)])), "integer"],
    ],
    ["Join", acc, ["List", p, when(["Or", equal(v, 0), ["Greater", p, l]], 0, inserted(q, p))]],
  );

  const grown = (row: MathJSON): MathJSON => equal(landing(row), add(length(row), 1));
  const cellsOf = (body: (row: MathJSON, column: MathJSON) => MathJSON): MathJSON =>
    built(
      upTo(nn),
      lets(
        [
          [q, at(rowOf, j), "integer"],
          [c, at(colOf, j), "integer"],
        ],
        body(q, c),
      ),
      j,
    );

  const step: MathJSON = lets(
    [[chain, fold(chainStep, acc, q, ["List", at(word, k)], upTo(n)), "list<integer>"]],
    [
      "Join",
      built(upTo(n), when(grown(q), add(length(q), 1), length(q)), q),
      cellsOf((row, column) => when(equal(landing(row), column), entering(row), inserted(row, column))),
    ],
  );

  return lets(
    [
      [n, ["Length", word], "integer"],
      [nn, times(n, n), "integer"],
      [rowOf, forEach(upTo(nn), add(["Floor", ["Divide", sub(j, 1), n]], 1), j), "list<integer>"],
      [colOf, forEach(upTo(nn), add(["Mod", sub(j, 1), n], 1), j), "list<integer>"],
    ],
    fold(step, s, k, forEach(upTo(add(n, nn)), 0, j), upTo(n)),
  );
};

/** The insertion tableau of the word `word` (any expression for a list of positive integers), as its rows. */
export const weakInsertionRows = (tag: string, word: MathJSON): MathJSON =>
  lets(
    [
      [`${tag}_word`, word, "list<integer>"],
      [`${tag}_len`, ["Length", `${tag}_word`], "integer"],
      [`${tag}_state`, weakState(tag, `${tag}_word`), "list<integer>"],
    ],
    forEach(
      upTo(["Count", keep(upTo(`${tag}_len`), ["Greater", at(`${tag}_state`, `${tag}_r`), 0], `${tag}_r`)]),
      forEach(
        upTo(at(`${tag}_state`, `${tag}_i`)),
        cell(`${tag}_state`, `${tag}_len`, `${tag}_len`, `${tag}_i`, `${tag}_c`),
        `${tag}_c`,
      ),
      `${tag}_i`,
    ),
  );
