---
name: ShiftedNaturalComajorIndex
domain: Tableau statistics
signature: ShiftedNaturalComajorIndex(tableau)
summary: The sum of n - e over the natural descents e, plus the sum of (r - 1) times the length of row r.
catalog:
  - system: findstat
    identity: St001697
    url: https://www.findstat.org/St001697
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: ShiftedNaturalComajorIndex(tableau)
    description: The sum of n - e over the natural descents e, plus the sum of (r - 1) times the length of row r.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The natural comajor index shifted by the weighted size of the shape (FindStat's St001697). A tableau of fewer than two entries has no natural descent and a weighted size of 0.
