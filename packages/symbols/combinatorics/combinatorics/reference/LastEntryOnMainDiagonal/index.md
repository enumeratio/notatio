---
name: LastEntryOnMainDiagonal
domain: Tableau statistics
signature: LastEntryOnMainDiagonal(tableau)
summary: "StandardTableau: The last entry on the main diagonal. SemistandardTableau: The last entry on the main diagonal."
catalog:
  - system: findstat
    identity: St000735
    url: https://www.findstat.org/St000735
    on: StandardTableau
  - system: findstat
    identity: St000737
    url: https://www.findstat.org/St000737
    on: SemistandardTableau
statOn:
  - SemistandardTableau
  - StandardTableau
signatures:
  - call: LastEntryOnMainDiagonal(tableau)
    description: The last entry on the main diagonal.
    library: enumeratio-combinatorics
    type: (semistandard_tableau | standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The empty tableau, which has no such entry, gives 0.
- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000737; the same head as on standard tableaux. The empty tableau gives 0.
