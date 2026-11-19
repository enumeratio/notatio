---
name: CanonicalPoset
domain: Combinatorial maps
signature: CanonicalPoset(Poset)
summary: The poset relabeled by the natural labeling with the least code, the one value of its isomorphism class.
mapOn:
  - Poset
signatures:
  - call: CanonicalPoset(Poset)
    description: The poset relabeled by the natural labeling with the least code, the one value of its isomorphism class.
    library: enumeratio-combinatorics
    type: (poset) -> poset
laws:
  - idempotent
  - graded:
      from: Posets
      to: Posets
---

- Takes a `Poset` and returns a `Poset` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- A natural labeling has a below b only when a < b as labels, and a poset's code is the rank of its comparability graph in LabeledGraphs(n): the pairs (a, b), a < b, numbered in lex order from 1, pair k the bit k - 1, set when a is below b. Two posets are isomorphic exactly when their canonical forms are equal, and the members of Posets(n) are the posets that are their own canonical forms. The definition tries every natural relabeling; the kernel that answers instead chooses the element for label n, then n - 1, down to 1, keeping the candidates whose block of pairs is least, and answers through 10 elements, where a code still fits a double (past that the call is left unevaluated, as it is for a value that is no poset past 6).
