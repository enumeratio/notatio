---
name: MinimalCylindricalInnerHeight
domain: Tableau statistics
signature: MinimalCylindricalInnerHeight(tableau)
summary: The number of rows less the overlap of the cylindrical tableau.
catalog:
  - system: findstat
    identity: St001804
    url: https://www.findstat.org/St001804
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: MinimalCylindricalInnerHeight(tableau)
    description: The number of rows less the overlap of the cylindrical tableau.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The height of the rectangular inner shape of the cylindrical tableau built from two copies (FindStat's St001804). The empty tableau gives 0.
