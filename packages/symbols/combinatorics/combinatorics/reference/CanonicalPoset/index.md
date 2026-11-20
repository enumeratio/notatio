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
- A natural labeling has a below b only when a < b as labels, and a poset's code is the rank of its comparability graph in LabeledGraphs(n): the pairs (a, b), a < b, numbered in lex order from 1, pair k the bit k - 1, set when a is below b. Two posets are isomorphic exactly when their canonical forms are equal, and the members of Posets(n) are the posets that are their own canonical forms. The definition tries every natural relabeling; the kernel that answers instead chooses the element for label n, then n - 1, down to 1, keeping the candidates whose block of pairs is least, and answers through 10 elements. That limit is what the checks cover, and the last size a code fits a double: the definition's body, run without its guard, gives the kernel's answer on a fixed sample at every size through 10 (all of it through 7, and past 7 with its table of permutations supplied), the properties of a canonical form hold on a sample through 10, and an independent brute force over every natural labeling finds the same least code on posets of 9 and 10. Past 10 the call is left unevaluated, as it is for a value that is no poset past 6.
