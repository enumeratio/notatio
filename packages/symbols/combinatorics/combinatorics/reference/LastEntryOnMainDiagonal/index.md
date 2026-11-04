---
name: LastEntryOnMainDiagonal
domain: Tableau statistics
signature: LastEntryOnMainDiagonal(tableau)
summary: The last entry on the main diagonal.
catalog:
  - system: findstat
    identity: St000735
    url: https://www.findstat.org/St000735
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: LastEntryOnMainDiagonal(tableau)
    description: The last entry on the main diagonal.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The empty tableau, which has no such entry, gives 0.
