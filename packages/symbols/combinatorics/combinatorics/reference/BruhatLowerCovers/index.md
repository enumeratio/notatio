---
name: BruhatLowerCovers
domain: Permutation statistics
signature: BruhatLowerCovers(p)
summary: Pairs i < j with p(i) > p(j) and no entry between them valued between p(j) and p(i).
catalog:
  - system: findstat
    identity: St000957
    url: https://www.findstat.org/St000957
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: BruhatLowerCovers(p)
    description: Pairs i < j with p(i) > p(j) and no entry between them valued between p(j) and p(i).
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- The boxed occurrences of 21.
