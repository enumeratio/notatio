---
name: FirstColumnInitialSequenceLength
domain: Tableau statistics
signature: FirstColumnInitialSequenceLength(tableau)
summary: The largest k such that the first column starts 1, 2, ..., k.
catalog:
  - system: findstat
    identity: St000745
    url: https://www.findstat.org/St000745
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: FirstColumnInitialSequenceLength(tableau)
    description: The largest k such that the first column starts 1, 2, ..., k.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's title is the index of the last row whose first entry is the row number (St000745).
