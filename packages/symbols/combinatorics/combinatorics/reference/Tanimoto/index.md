---
name: Tanimoto
domain: Combinatorial maps
signature: Tanimoto(Permutation)
summary: "Tanimoto's operator: every entry goes up by one with n becoming 1, except that an n at the front or the back is removed and a 1 is placed at the other end."
catalog:
  - system: findstat
    identity: Mp00329
    url: https://www.findstat.org/Mp00329
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: Tanimoto(Permutation)
    description: "Tanimoto's operator: every entry goes up by one with n becoming 1, except that an n at the front or the back is removed and a 1 is placed at the other end."
    library: enumeratio-combinatorics
    type: (permutation) -> permutation
---

- Takes a `Permutation` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00329, a bijection.
