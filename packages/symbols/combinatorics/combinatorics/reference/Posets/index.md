---
name: Posets
domain: Combinatorics
signature: Posets(n)
summary: The posets on $n$ elements up to isomorphism, one canonical value each.
signatures:
  - call: Posets(n)
    library: enumeratio-combinatorics
    description: every poset on $n$ elements, one per isomorphism class, in ascending canonical code.
    type: (integer<0..>) -> indexed_collection<poset>
enumerate:
  expr: Posets(4)
  glyph: hasse
  columns: AntichainCount, ChainCount, ChainPolytopeFacetCount, CoverRelationCount
seeAlso:
  - CanonicalPoset
  - IsIsomorphicPoset
  - Count
  - At
catalog:
  - system: oeis
    identity: A000112
    url: https://oeis.org/A000112
grades:
  - name: n
    role: axis
carrier: Poset
---

- A lazy indexed collection; its count is $A000112(n)$, and $A000112(6) = 318$. Each element is a [[Poset]] in its canonical labeling.
- The order is ascending canonical code. A naturally labeled poset has $a$ below $b$ only when $a < b$ as labels, and its code is the rank of its comparability graph in `LabeledGraphs(n)`: the pairs $(a, b)$, $a < b$, are numbered in lex order from 1, and pair $k$ is bit $k - 1$, set when $a$ is below $b$. The canonical labeling is the natural labeling with the least code, so the antichain is first (code 0) and the chain last (every bit set), and two posets are isomorphic exactly when their canonical codes are equal.
- The classes are generated on first use, each size from the one below: label 1 is a minimal element, so a canonical code is the code of a canonical poset on $n - 1$ elements, shifted left by $n - 1$ bits, plus the up-set of elements above 1. There is no table file; the first list of 9 takes about five seconds, and each size takes some fourteen times the one before.
- Past 9 elements the collection is left unevaluated, with a message. The definition, which scans every code below $2^{\binom{n}{2}}$ against every natural relabeling, is the meaning and is held to the lists through 4 elements (5 in the nightly sweep); it answers in a few seconds through 3 elements interpreted and through 6 compiled.
- [[CanonicalPoset]] gives a poset's canonical form and [[IsIsomorphicPoset]] compares two.
