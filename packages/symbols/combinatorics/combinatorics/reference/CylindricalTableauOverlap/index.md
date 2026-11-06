---
name: CylindricalTableauOverlap
domain: Tableau statistics
signature: CylindricalTableauOverlap(tableau)
summary: The number of rows, from the top, as long as the first row and starting, from the bottom, above the last entry of the first row.
catalog:
  - system: findstat
    identity: St001803
    url: https://www.findstat.org/St001803
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: CylindricalTableauOverlap(tableau)
    description: The number of rows, from the top, as long as the first row and starting, from the bottom, above the last entry of the first row.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The overlap of the cylindrical tableau built from two copies (FindStat's St001803). The empty tableau gives 0.
