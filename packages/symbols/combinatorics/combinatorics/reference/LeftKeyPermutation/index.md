---
name: LeftKeyPermutation
domain: Combinatorial maps
signature: LeftKeyPermutation(AlternatingSignMatrix)
summary: "The permutation of the left key of the matrix: the columns of its tableau slid left by Willis's scan give a key tableau, whose columns drop one entry each."
catalog:
  - system: findstat
    identity: Mp00002
    url: https://www.findstat.org/Mp00002
    on: AlternatingSignMatrix
mapOn:
  - AlternatingSignMatrix
signatures:
  - call: LeftKeyPermutation(AlternatingSignMatrix)
    description: "The permutation of the left key of the matrix: the columns of its tableau slid left by Willis's scan give a key tableau, whose columns drop one entry each."
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> permutation
---

- Takes a `AlternatingSignMatrix` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00002 (Lascoux; Aval, Keys and alternating sign matrices). Surjective.
