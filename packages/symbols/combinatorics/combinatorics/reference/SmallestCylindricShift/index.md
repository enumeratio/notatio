---
name: SmallestCylindricShift
domain: Tableau statistics
signature: SmallestCylindricShift(tableau)
summary: The least shift s at which each entry of the last row is smaller than the first row's entry s columns on.
catalog:
  - system: findstat
    identity: St001993
    url: https://www.findstat.org/St001993
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: SmallestCylindricShift(tableau)
    description: The least shift s at which each entry of the last row is smaller than the first row's entry s columns on.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Shifts below width - last row length cannot work, and a shift that works keeps working one column on, so the least one is that bound plus the shifts above it that fail (FindStat's St001993). The empty tableau gives 0.
