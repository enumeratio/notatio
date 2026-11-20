---
name: IsIsomorphicPoset
domain: Combinatorics
signature: IsIsomorphicPoset(p, q)
summary: Whether two [[Poset]] values have the same structure, up to relabeling the elements.
signatures:
  - call: IsIsomorphicPoset(p, q)
    description: true iff the canonical forms of p and q are equal; unevaluated, with a message, once either poset has more than 10 elements.
    library: enumeratio-combinatorics
    type: (poset, poset) -> boolean
seeAlso:
  - CanonicalPoset
  - Posets
  - IsIsomorphicGraph
---

- Two posets are isomorphic exactly when their [[CanonicalPoset]] forms are equal, which is when their canonical codes are, and this compares the codes. Equality of two `Poset` values stays structural: it asks whether the lists of lower covers are the same, not whether the posets are.
- The search that finds a code is the one [[CanonicalPoset]] runs; the limit of 10 elements is the one [[CanonicalPoset]] rests on: that search is checked against the definition's body and a brute force through 10, and a code fits a double through 10. On a sample, posets of equal size, relations, height and width that are not isomorphic get different codes, so the comparison separates them. A poset of more elements is left unevaluated.
