---
name: ShynarInversionCount
domain: Tableau statistics
signature: ShynarInversionCount(tableau)
summary: Pairs of entries e < f with f strictly southwest of e.
catalog:
  - system: findstat
    identity: St000057
    url: https://www.findstat.org/St000057
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: ShynarInversionCount(tableau)
    description: Pairs of entries e < f with f strictly southwest of e.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Shynar's inversion number (FindStat's St000057). A tableau of fewer than two entries gives 0.
