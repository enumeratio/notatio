---
name: SymmetricAlternatingSignMatrix
domain: Combinatorial maps
signature: SymmetricAlternatingSignMatrix(DyckPath)
summary: "The diagonally symmetric alternating sign matrix of a path: a 1 along the antidiagonal under each peak, a -1 along the one under each valley, as far as the path's height."
catalog:
  - system: findstat
    identity: Mp00137
    url: https://www.findstat.org/Mp00137
    on: DyckPath
mapOn:
  - DyckPath
signatures:
  - call: SymmetricAlternatingSignMatrix(DyckPath)
    description: "The diagonally symmetric alternating sign matrix of a path: a 1 along the antidiagonal under each peak, a -1 along the one under each valley, as far as the path's height."
    library: enumeratio-combinatorics
    type: (dyck_path) -> alternating_sign_matrix
---

- Takes a `DyckPath` and returns a `AlternatingSignMatrix` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00137 (Rubey, arXiv 1707.06802), an injection.
