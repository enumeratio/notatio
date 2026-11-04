---
name: CycleAsOneLineNotation
domain: Combinatorial maps
signature: CycleAsOneLineNotation(Permutation)
summary: The cycles, each written from its least point and in order of those points, read as one word.
laws:
  - graded:
      from: Permutations
      to: Permutations
    on: permutation
catalog:
  - system: findstat
    identity: Mp00090
    url: https://www.findstat.org/Mp00090
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: CycleAsOneLineNotation(Permutation)
    description: The cycles, each written from its least point and in order of those points, read as one word.
    library: enumeratio-combinatorics
    type: (permutation) -> permutation
---

- Takes a `Permutation` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00090, Sage's cycle_tuples concatenated. Foata's fundamental transformation is the same with the greatest point in front.
