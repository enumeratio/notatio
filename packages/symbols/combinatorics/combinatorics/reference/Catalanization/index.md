---
name: Catalanization
domain: Combinatorial maps
signature: Catalanization(Permutation)
summary: The product of the transpositions (i j), one for each inversion at positions i < j in lexicographic order, each exchanging the entries i and j.
laws:
  - graded:
      from: Permutations
      to: Permutations
    on: permutation
catalog:
  - system: findstat
    identity: Mp00277
    url: https://www.findstat.org/Mp00277
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: Catalanization(Permutation)
    description: The product of the transpositions (i j), one for each inversion at positions i < j in lexicographic order, each exchanging the entries i and j.
    library: enumeratio-combinatorics
    type: (permutation) -> permutation
---

- Takes a `Permutation` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00277, the catalanization of a permutation. It fixes exactly the 231-avoiding permutations.
