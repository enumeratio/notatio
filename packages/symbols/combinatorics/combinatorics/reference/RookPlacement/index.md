---
name: RookPlacement
domain: Combinatorics
signature: RookPlacement(columns)
summary: A placement of non-attacking rooks on an $n \times n$ board, as the column of the rook in each row, 0 for none.
catalogCarrier: true
signatures:
  - call: RookPlacement(columns)
    description: A placement of non-attacking rooks on an $n \times n$ board, as the column of the rook in each row, 0 for none.
    library: enumeratio-combinatorics
    type: (list<integer>) -> rook_placement
---

- The list has one entry per row of an $n \times n$ board: the column of that row's rook, or 0 if the row has none. The nonzero entries are distinct, so no two rooks share a column (nor, with one entry a row, a row). Equivalently it is a partial injection of $\{1, \dots, n\}$, or a matching of the complete bipartite graph $K_{n,n}$.
- `RookPlacement([2, 0, 1])` puts a rook at column 2 of row 1, none in row 2 and one at column 1 of row 3.
- The family [[RookPlacements]] lists them; a placement of $n$ rooks is a [[Permutation]].
