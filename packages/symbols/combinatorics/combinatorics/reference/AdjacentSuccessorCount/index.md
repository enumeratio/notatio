---
name: AdjacentSuccessorCount
domain: Tableau statistics
signature: AdjacentSuccessorCount(tableau)
summary: Entries whose successor is the neighbor to their right or directly below them.
catalog:
  - system: findstat
    identity: St000743
    url: https://www.findstat.org/St000743
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: AdjacentSuccessorCount(tableau)
    description: Entries whose successor is the neighbor to their right or directly below them.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Consecutive entries of a row or a column are always neighbors, so this counts the entries e with e + 1 in the same row or the same column.
