---
name: Restriction
domain: Combinatorial maps
signature: Restriction(Permutation)
summary: The permutation with its largest letter removed.
catalog:
  - system: findstat
    identity: Mp00252
    url: https://www.findstat.org/Mp00252
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: Restriction(Permutation)
    description: The permutation with its largest letter removed.
    library: enumeratio-combinatorics
    type: (permutation) -> permutation
---

- Takes a `Permutation` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00252. Undefined for the empty permutation. Lossy: the position of the largest letter is forgotten.
