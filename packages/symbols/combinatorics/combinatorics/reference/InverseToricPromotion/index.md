---
name: InverseToricPromotion
domain: Combinatorial maps
signature: InverseToricPromotion(Permutation)
summary: "The same swaps as ToricPromotion in the opposite order: n and 1, then n - 1 and n, down to 1 and 2."
laws:
  - bijection
  - inverse: ToricPromotion
  - graded:
      from: Permutations
      to: Permutations
    on: permutation
catalog:
  - system: findstat
    identity: Mp00309
    url: https://www.findstat.org/Mp00309
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: InverseToricPromotion(Permutation)
    description: "The same swaps as ToricPromotion in the opposite order: n and 1, then n - 1 and n, down to 1 and 2."
    library: enumeratio-combinatorics
    type: (permutation) -> permutation
---

- Takes a `Permutation` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00309, titled the inverse of toric promotion.
