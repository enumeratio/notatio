---
name: ReadingWord
domain: Combinatorial maps
signature: ReadingWord(StandardTableau)
summary: The rows read left to right, from the bottom row up, as a permutation.
catalog:
  - system: findstat
    identity: Mp00081
    url: https://www.findstat.org/Mp00081
    on: StandardTableau
  - system: findstat
    identity: Mp00075
    url: https://www.findstat.org/Mp00075
    on: SemistandardTableau
mapOn:
  - SemistandardTableau
  - StandardTableau
laws:
  - graded:
      from: StandardTableaux
      to: Permutations
    on: standard_tableau
signatures:
  - call: ReadingWord(StandardTableau)
    description: The rows read left to right, from the bottom row up, as a permutation.
    library: enumeratio-combinatorics
    type: ((semistandard_tableau) -> permutation) & ((standard_tableau) -> permutation)
---

- Takes a `StandardTableau` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00081, the row reading word. Injective; RskInsertion of it is the tableau back again.
- Also takes a `SemistandardTableau`, returning a `Permutation`: The rows read left to right, from the bottom row up, standardized into a permutation.
- FindStat's Mp00075. Equal entries are ranked left to right, so the permutation's insertion tableau is the standardization of the tableau.
