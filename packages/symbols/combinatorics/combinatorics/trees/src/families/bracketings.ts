// Bracketings of M leaves in Epsil, the structure behind Dissections and TotalPartitions: the ways to
// group the leaves 1..M, in order, into brackets of at least two items each (an item a leaf or a
// bracket), the whole being one bracket when M ≥ 2. A bracket over leaves a..b is the span (a, b);
// the spans but the whole are the chords (a, b + 1) of a dissection of the (M + 1)-gon, and they
// are listed in preorder, which is by start and then longest first.
//
// An item of size s is a leaf (s = 1) or a bracket, U(s) of them, U(1) = 1 and U(s) the
// brackets of s leaves. A sequence of items over m leaves is ranked by its first item's size h, then
// that item, then the rest: it has U(h) W(m − h) members for each h, W(r) the sequences over r leaves
// (W(0) = 1, W(1) = 1, W(r) = 2 U(r) from 2: a sequence is one item or a bracket's contents).
// A bracket's contents are the sequences of two or more items, the same blocks without h = m, so
//   U(s) = Σ_{h < s} U(h) W(s − h): 1, 1, 3, 11, 45, … (A001003).
// The machines walk with an explicit stack of frames (kind, start, size, rank or multiplier), as the
// tree families do (../../trees/src/families/stack.ts): a frame is a bracket (kind 1) or a sequence.
import {
  add,
  and,
  at,
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
} from "../../../collections/src/families/tables.ts";
import { ANY, isInteger, put, zeros } from "../../../collections/src/families/nested.ts";
import { frames, heightAfter, writes } from "./stack.ts";

type MathJSON = unknown;

/** The pieces over `M` leaves (an expression in the family's params). */
export function bracketings(M: MathJSON) {
  const U = (s: MathJSON): MathJSON => at("_tables", s);
  /** W(x): the sequences of items over x leaves. */
  const W = (x: MathJSON): MathJSON => iff(["Or", equal(x, 0), equal(x, 1)], 1, mul(2, U(x)));
  const steps = upTo(1, mul(2, M));
  const frameRoom = add(mul(2, M), 1);

  const tables = fold(
    [
      "Join",
      "bt",
      [
        "List",
        fold(
          add("bs", mul(at("bt", "bh"), iff(equal(sub("bk", "bh"), 1), 1, mul(2, at("bt", sub("bk", "bh")))))),
          "bs",
          "bh",
          0,
          upTo(1, sub("bk", 1)),
        ),
      ],
    ],
    "bt",
    "bk",
    ["List", 1],
    upTo(2, M),
    "list<integer>",
  );

  // ─── unrank: the chords as a flat list. State [height, chords written, chord slots, frames]. ───
  const UF = frames(add(2, mul(2, M)), 4);
  const uf = (c: number): MathJSON => UF.field("us", "ut", c);
  const unrankStep = iff(
    equal(at("us", 1), 0),
    "us",
    lets(
      [
        ["ut", at("us", 1), "integer"],
        ["ue", at("us", 2), "integer"],
        ["uk", uf(1), "integer"],
        ["ua", uf(2), "integer"],
        ["um", uf(3), "integer"],
        // [rank left in the block, the first item's size, found].
        [
          "ufound",
          fold(
            iff(
              equal(at("uf", 3), 1),
              "uf",
              iff(
                less(at("uf", 1), mul(U("uh"), W(sub("um", "uh")))),
                ["List", at("uf", 1), "uh", 1],
                ["List", sub(at("uf", 1), mul(U("uh"), W(sub("um", "uh")))), "uh", 0],
              ),
            ),
            "uf",
            "uh",
            ["List", uf(4), 0, 0],
            upTo(1, "um"),
          ),
          "list<integer>",
        ],
        ["uh", at("ufound", 2), "integer"],
        ["uw", W(sub("um", at("ufound", 2))), "integer"],
        // A bracket but the whole is a chord; written in the slot at hand and kept only if counted.
        ["uemit", iff(and(equal("uk", 1), ["Not", and(equal("ua", 1), equal("um", M))]), 1, 0), "integer"],
      ],
      writes(
        "us",
        [1, heightAfter("ut", less("uh", "um"), less(1, "uh"))],
        [2, add("ue", "uemit")],
        [add(3, mul(2, "ue")), "ua"],
        [add(4, mul(2, "ue")), add("ua", "um")],
        ...UF.push(
          "ut",
          less("uh", "um"),
          [0, add("ua", "uh"), sub("um", "uh"), ["Mod", at("ufound", 1), "uw"]],
          [1, "ua", "uh", quotient(at("ufound", 1), "uw")],
        ),
      ),
    ),
  );
  const unrankChords: MathJSON = lets(
    [
      [
        "ufin",
        fold(
          unrankStep,
          "us",
          "ustep",
          [
            "Join",
            ["List", iff(less(M, 2), 0, 1), 0],
            zeros(mul(2, M)),
            ["List", 1, 1, M, "_r"],
            zeros(mul(4, frameRoom)),
          ],
          steps,
        ),
        "list<integer>",
      ],
    ],
    ["Take", ["Drop", "ufin", 2], mul(2, at("ufin", 2))],
  );

  // ─── rank of the chords `cx`: state [height, rank, frames (kind, start, size, multiplier)]. ───
  const RF = frames(2, 4);
  const rf = (c: number): MathJSON => RF.field("rs", "rt", c);
  const pairs: MathJSON = quotient(["Length", "cx"], 2);
  const rankStep = iff(
    equal(at("rs", 1), 0),
    "rs",
    lets(
      [
        ["rt", at("rs", 1), "integer"],
        ["rk", rf(1), "integer"],
        ["ra", rf(2), "integer"],
        ["rm", rf(3), "integer"],
        ["rmult", rf(4), "integer"],
        // The first item's size: that of the longest chord from the start inside the frame (a bracket
        // frame's own chord is not inside it), a leaf otherwise.
        [
          "rh",
          fold(
            iff(
              and(
                equal(at("cx", sub(mul(2, "rp"), 1)), "ra"),
                ["GreaterEqual", sub(at("cx", mul(2, "rp")), "ra"), 2],
                ["LessEqual", sub(at("cx", mul(2, "rp")), "ra"), sub("rm", "rk")],
              ),
              ["Max", "rq", sub(at("cx", mul(2, "rp")), "ra")],
              "rq",
            ),
            "rq",
            "rp",
            1,
            upTo(1, pairs),
          ),
          "integer",
        ],
        ["roff", fold(add("ro", mul(U("ri"), W(sub("rm", "ri")))), "ro", "ri", 0, upTo(1, sub("rh", 1))), "integer"],
        ["rw", W(sub("rm", "rh")), "integer"],
      ],
      writes(
        "rs",
        [1, heightAfter("rt", less("rh", "rm"), less(1, "rh"))],
        [2, add(at("rs", 2), mul("rmult", "roff"))],
        ...RF.push(
          "rt",
          less("rh", "rm"),
          [0, add("ra", "rh"), sub("rm", "rh"), "rmult"],
          [1, "ra", "rh", mul("rmult", "rw")],
        ),
      ),
    ),
  );
  const rankChords: MathJSON = at(
    fold(
      rankStep,
      "rs",
      "rstep",
      ["Join", ["List", iff(less(M, 2), 0, 1), 0, 1, 1, M, 1], zeros(mul(4, frameRoom))],
      steps,
    ),
    2,
  );

  return { tables, count: iff(less(M, 1), 0, U(M)), unrankChords, rankChords, steps };
}

/** The chords `pc` (a bound flat list, the bracketing's spans but the whole) as a token word, one
 *  leaf at a time: 1 per bracket opening at it, the leaf 0, −1 per bracket closing at it. */
const tokens = (pc: string, M: MathJSON): MathJSON => {
  const pairs = quotient(["Length", pc], 2);
  const countAt = (side: 1 | 2, value: MathJSON): MathJSON =>
    fold(
      add("tc", iff(equal(at(pc, sub(mul(2, "tp"), side === 1 ? 1 : 0)), value), 1, 0)),
      "tc",
      "tp",
      0,
      upTo(1, pairs),
    );
  return fold(
    [
      "Join",
      "tw",
      map(1, "tz1", upTo(1, countAt(1, "ti"))),
      ["List", 0],
      map(-1, "tz2", upTo(1, countAt(2, add("ti", 1)))),
    ],
    "tw",
    "ti",
    ["List"],
    upTo(1, M),
    "list<integer>",
  );
};

/** The nested list of the chords `pc` over `M` leaves: the whole a list of its items, a leaf 0. A
 *  stack of the item lists being built, a token 1 opening one, 0 adding a leaf, −1 closing the top
 *  one into the one below. State: [height, the stack's cells…]; the whole is the first cell. */
export function nestedOf(pc: string, M: MathJSON): MathJSON {
  const height = at("nt", 1);
  const body = fold(
    lets(
      [["nt", "ns", ANY]],
      iff(
        equal("nk", 1),
        put("ns", [1, add(height, 1)], [add(height, 2), ["List"]]),
        iff(
          equal("nk", 0),
          lets([["nc", at("nt", add(height, 1)), ANY]], put("ns", [add(height, 1), ["Join", "nc", ["List", 0]]])),
          lets(
            [["nc", at("nt", height), ANY]],
            put("ns", [1, sub(height, 1)], [height, ["Join", "nc", ["List", at("nt", add(height, 1))]]]),
          ),
        ),
      ),
    ),
    "ns",
    "nk",
    ["Join", ["List", 1, ["List"]], zeros(add(M, 2))],
    "nw",
  );
  return iff(equal(M, 1), 0, lets([["nw", tokens(pc, M), "list<integer>"]], at(body, 2)));
}

/** A nested list `tree` read as chords: a leaf is 0, a bracket a list of two or more items, M leaves
 *  in all. A stack of items, each a subtree still to open (kind 1) or the close it owes (kind 0,
 *  holding its chord's slot); opening one writes the chord's start, closing it the end. State:
 *  [height, leaves, chords, bad, the chords' slots, the kinds, the cells]; the tree is sound when
 *  it ends at height 0 with bad 0 and M leaves. The first chord is the whole. */
export function readNested(tree: MathJSON, M: MathJSON): MathJSON {
  const slots = add(mul(2, M), 2);
  const room = add(mul(3, M), 4);
  const kindAt = (c: MathJSON): MathJSON => add(4, slots, c);
  const cellAt = (c: MathJSON): MathJSON => add(4, slots, room, c);
  const [height, leaves, chords] = [at("ft", 1), at("ft", 2), at("ft", 3)];
  const item = at("ft", cellAt(height));
  const children = ["Length", item];
  const pop = (...cells: readonly (readonly [MathJSON, MathJSON])[]): MathJSON =>
    put("ft", [1, sub(height, 1)], ...cells);
  const open = fold(
    put("fa", [cellAt(add(height, "fi")), at(item, sub(add(children, 1), "fi"))], [kindAt(add(height, "fi")), 1]),
    "fa",
    "fi",
    put(
      "ft",
      [add(3, mul(2, add(chords, 1))), add(leaves, 1)],
      [3, add(chords, 1)],
      [cellAt(height), add(chords, 1)],
      [kindAt(height), 0],
      [1, add(height, children)],
    ),
    upTo(1, children),
  );
  return fold(
    lets(
      [["ft", "fs", ANY]],
      iff(
        equal(height, 0),
        "ft",
        iff(
          equal(at("ft", kindAt(height)), 0),
          pop([add(4, mul(2, item)), add(leaves, 1)]),
          iff(
            isInteger(item),
            iff(equal(item, 0), pop([2, add(leaves, 1)]), pop([4, 1])),
            iff(
              ["Or", less(children, 2), ["Greater", add(height, children), room], ["Greater", add(chords, 1), M]],
              pop([4, 1]),
              open,
            ),
          ),
        ),
      ),
    ),
    "fs",
    "fj",
    ["Join", ["List", 1, 0, 0, 0], zeros(slots), ["List", 1], zeros(sub(room, 1)), ["List", tree], zeros(sub(room, 1))],
    upTo(1, mul(3, M)),
  );
}
