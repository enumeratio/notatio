---
name: Gyration
domain: Combinatorial maps
signature: Gyration(AlternatingSignMatrix)
summary: "Wieland's gyration: the height function toggled at the vertices of even parity, then of odd parity."
catalog:
  - system: findstat
    identity: Mp00006
    url: https://www.findstat.org/Mp00006
    on: AlternatingSignMatrix
mapOn:
  - AlternatingSignMatrix
signatures:
  - call: Gyration(AlternatingSignMatrix)
    description: "Wieland's gyration: the height function toggled at the vertices of even parity, then of odd parity."
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> alternating_sign_matrix
---

- Takes a `AlternatingSignMatrix` and returns a `AlternatingSignMatrix` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00006, a bijection of the alternating sign matrices of a size.
