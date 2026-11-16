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
seeAlso:
  - Posets
  - IsIsomorphicPoset
laws:
  - idempotent
  - graded:
      from: Posets
      to: Posets
---

- Takes a `Poset` and returns a `Poset` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- A naturally labeled poset has $a$ below $b$ only when $a < b$ as labels. Its code is the rank of its comparability graph in `LabeledGraphs(n)`: the pairs $(a, b)$, $a < b$, are numbered in lex order from 1, and pair $k$ is bit $k - 1$, set when $a$ is below $b$. The result is the natural relabeling with the least code, so two posets are isomorphic exactly when their canonical forms are equal, and the members of [[Posets]] are the posets that are their own canonical forms.
- The definition tries every natural relabeling. The kernel that answers instead chooses the element for label $n$, then $n - 1$, down to 1, keeping the candidates whose block of pairs is least (each must have every element above it already chosen); it answers through 10 elements, where a code still fits a double, and past that the call is left unevaluated.
