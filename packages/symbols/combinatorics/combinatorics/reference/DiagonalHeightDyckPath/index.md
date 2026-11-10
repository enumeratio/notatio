---
name: DiagonalHeightDyckPath
domain: Combinatorial maps
signature: DiagonalHeightDyckPath(AlternatingSignMatrix)
summary: The Dyck path whose heights are the height function of the matrix along the diagonal and the diagonal beside it.
catalog:
  - system: findstat
    identity: Mp00334
    url: https://www.findstat.org/Mp00334
    on: AlternatingSignMatrix
mapOn:
  - AlternatingSignMatrix
signatures:
  - call: DiagonalHeightDyckPath(AlternatingSignMatrix)
    description: The Dyck path whose heights are the height function of the matrix along the diagonal and the diagonal beside it.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> dyck_path
---

- Takes a `AlternatingSignMatrix` and returns a `DyckPath` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00334 (Lemma 3.7 of arXiv 2511.06968). Surjective.
