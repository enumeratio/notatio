---
name: AttackingPairCount
domain: Tableau statistics
signature: AttackingPairCount(tableau)
summary: Pairs of cells of the shape with one strictly west of the other in a row, or the first in the row below and strictly east of the second.
catalog:
  - system: findstat
    identity: St000016
    url: https://www.findstat.org/St000016
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: AttackingPairCount(tableau)
    description: Pairs of cells of the shape with one strictly west of the other in a row, or the first in the row below and strictly east of the second.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- A cell with k cells west of it in its row makes k pairs there and k more with the row above, if it has a row above. It depends on the shape alone (FindStat's St000016). The empty tableau gives 0.
