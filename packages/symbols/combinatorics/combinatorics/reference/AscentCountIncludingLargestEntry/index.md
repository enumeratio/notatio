---
name: AscentCountIncludingLargestEntry
domain: Tableau statistics
signature: AscentCountIncludingLargestEntry(tableau)
summary: Entries whose successor is in the same or a higher row, and the largest entry.
catalog:
  - system: findstat
    identity: St000507
    url: https://www.findstat.org/St000507
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: AscentCountIncludingLargestEntry(tableau)
    description: Entries whose successor is in the same or a higher row, and the largest entry.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The size less the descents of the tableau; FindStat's St000507 counts the largest entry, which has no successor, as an ascent. The empty tableau gives 0.
