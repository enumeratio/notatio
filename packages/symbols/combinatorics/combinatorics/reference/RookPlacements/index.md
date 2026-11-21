---
name: RookPlacements
domain: Combinatorics
signature: RookPlacements(n)
summary: The placements of any number of non-attacking rooks on an $n \times n$ board, as a lazy indexed family.
signatures:
  - call: RookPlacements(n)
    description: the partial injections of $\{1, \dots, n\}$, as the column of each row's rook, in lexicographic order.
    library: enumeratio-combinatorics
    type: (integer<0..>) -> indexed_collection<rook_placement>
seeAlso:
  - SymmetricGroup
references:
  - system: oeis
    identity: A002720
catalog:
  - system: oeis
    identity: A002720
grades:
  - name: n
    role: axis
carrier: RookPlacement
---

- A placement is the list of the column of each row's rook, 0 for a row with none; the nonzero entries are distinct, so no two rooks attack. They are listed lexicographically, 0 before any column: for $n = 2$, $(0, 0), (0, 1), (0, 2), (1, 0), (1, 2), (2, 0), (2, 1)$.
- There are $\sum_k \binom{n}{k}^2 k!$ of them, OEIS A002720: $1, 2, 7, 34, 209, 1546, \ldots$. The placements of $n$ rooks are the $n!$ permutations.
