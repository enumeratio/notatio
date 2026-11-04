---
name: StandardPermutation
domain: Combinatorial maps
signature: StandardPermutation(BinaryWord)
summary: The permutation ranking the letters of the word, equal letters from left to right.
laws:
  - graded:
      from: BinaryWords
      to: Permutations
    on: binary_word
catalog:
  - system: findstat
    identity: Mp00336
    url: https://www.findstat.org/Mp00336
    on: BinaryWord
mapOn:
  - BinaryWord
signatures:
  - call: StandardPermutation(BinaryWord)
    description: The permutation ranking the letters of the word, equal letters from left to right.
    library: enumeratio-combinatorics
    type: (binary_word) -> permutation
---

- Takes a `BinaryWord` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00336, Sage's standard_permutation. The image is the Grassmannian permutations, those with at most one descent.
