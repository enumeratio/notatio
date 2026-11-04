---
name: SimionSchmidt
domain: Combinatorial maps
signature: SimionSchmidt(Permutation)
summary: "The left-to-right minima stay in place and the other positions take the remaining values, largest first: a 123-avoiding permutation."
laws:
  - idempotent
  - graded:
      from: Permutations
      to: Permutations
    on: permutation
catalog:
  - system: findstat
    identity: Mp00068
    url: https://www.findstat.org/Mp00068
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: SimionSchmidt(Permutation)
    description: "The left-to-right minima stay in place and the other positions take the remaining values, largest first: a 123-avoiding permutation."
    library: enumeratio-combinatorics
    type: (permutation) -> permutation
---

- Takes a `Permutation` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00068, Sage's simion_schmidt(avoid=[1,2,3]). Idempotent; a bijection from the 132-avoiding permutations to the 123-avoiding ones.
