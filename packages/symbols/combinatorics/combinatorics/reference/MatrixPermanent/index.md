---
name: MatrixPermanent
domain: Alternating sign matrix statistics
signature: MatrixPermanent(matrix)
summary: "The permanent: the sum over the permutations s of the product of a(i, s(i))."
signatures:
  - call: MatrixPermanent(tableau)
    description: "The permanent: the sum over the permutations s of the product of a(i, s(i))."
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
catalog:
  - system: findstat
    identity: St001260
    url: https://www.findstat.org/St001260
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001260. Ryser's formula: (-1)^n times the sum over the sets S of columns of (-1)^|S| times the product over the rows of the row's sum over S. The sets are the numbers 0 .. 2^n - 1 read in binary.
