---
name: PathLengthToLargestEntry
domain: Tableau statistics
signature: PathLengthToLargestEntry(tableau)
summary: The length of the path from the top left cell to the largest entry, one step per cell down or to the right.
catalog:
  - system: findstat
    identity: St000744
    url: https://www.findstat.org/St000744
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: PathLengthToLargestEntry(tableau)
    description: The length of the path from the top left cell to the largest entry, one step per cell down or to the right.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat sums the 0-based row and column of the cell. The empty tableau, which has no such entry, gives 0.
