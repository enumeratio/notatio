---
name: OsculatingPathMajorIndex
domain: Alternating sign matrix statistics
signature: OsculatingPathMajorIndex(matrix)
summary: The sum, over the columns of the monotone triangle, of the major index of the Dyck word of the column's nondecreasing parking function.
catalog:
  - system: findstat
    identity: St000227
    url: https://www.findstat.org/St000227
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: OsculatingPathMajorIndex(matrix)
    description: The sum, over the columns of the monotone triangle, of the major index of the Dyck word of the column's nondecreasing parking function.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000227, read from its Sage code: column m of the monotone triangle (rows longest first, entries decreasing) gives the nondecreasing parking function side + 1 - m - entry m of each row longer than m; its Dyck word has one up step per value j followed by a down step, for each j. Reversed, the word's peaks add their positions, which is the sum over the valleys of the unreversed word of their distance from the end; this gives all 480 of its rows (matrices of orders 2 to 5). The matrix of order 1 gives 0.
