---
name: ToricPromotion
domain: Combinatorial maps
signature: ToricPromotion(Permutation)
summary: "Toric promotion of the path graph: swap the values 1 and 2, then 2 and 3, and so on up to n and 1, each swap skipped when the two values sit next to each other."
laws:
  - bijection
  - inverse: InverseToricPromotion
  - graded:
      from: Permutations
      to: Permutations
    on: permutation
catalog:
  - system: findstat
    identity: Mp00310
    url: https://www.findstat.org/Mp00310
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: ToricPromotion(Permutation)
    description: "Toric promotion of the path graph: swap the values 1 and 2, then 2 and 3, and so on up to n and 1, each swap skipped when the two values sit next to each other."
    library: enumeratio-combinatorics
    type: (permutation) -> permutation
---

- Takes a `Permutation` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00310. Its order is n - 1; the inverse is InverseToricPromotion.
