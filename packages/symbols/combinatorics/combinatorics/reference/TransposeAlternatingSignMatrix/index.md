---
name: TransposeAlternatingSignMatrix
domain: Combinatorial maps
signature: TransposeAlternatingSignMatrix(AlternatingSignMatrix)
summary: "The transpose: rows become columns."
catalog:
  - system: findstat
    identity: Mp00005
    url: https://www.findstat.org/Mp00005
    on: AlternatingSignMatrix
mapOn:
  - AlternatingSignMatrix
signatures:
  - call: TransposeAlternatingSignMatrix(AlternatingSignMatrix)
    description: "The transpose: rows become columns."
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> alternating_sign_matrix
---

- Takes a `AlternatingSignMatrix` and returns a `AlternatingSignMatrix` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00005, an involution.
