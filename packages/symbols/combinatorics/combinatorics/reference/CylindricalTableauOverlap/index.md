---
name: CylindricalTableauOverlap
domain: Tableau statistics
signature: CylindricalTableauOverlap(tableau)
summary: "StandardTableau: The number of rows, from the top, as long as the first row and starting, from the bottom, above the last entry of the first row. SemistandardTableau: The number of rows, from the top, as long as the first row and starting, from the bottom, at or above the last entry of the first row."
catalog:
  - system: findstat
    identity: St001803
    url: https://www.findstat.org/St001803
    on: StandardTableau
  - system: findstat
    identity: St001805
    url: https://www.findstat.org/St001805
    on: SemistandardTableau
statOn:
  - SemistandardTableau
  - StandardTableau
signatures:
  - call: CylindricalTableauOverlap(tableau)
    description: The number of rows, from the top, as long as the first row and starting, from the bottom, above the last entry of the first row.
    library: enumeratio-combinatorics
    type: (semistandard_tableau | standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The overlap of the cylindrical tableau built from two copies (FindStat's St001803). The empty tableau gives 0.
- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001805, the overlap of the cylindrical tableau built from two copies; the same head as on standard tableaux, where the entries differ so that the comparison is strict. The empty tableau gives 0.
