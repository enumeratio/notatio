---
name: AttackingInversionCount
domain: Tableau statistics
signature: AttackingInversionCount(tableau)
summary: "Attacking pairs of cells whose entries are out of order: the cell in the lower row, strictly east of the other, holds the larger entry."
catalog:
  - system: findstat
    identity: St000017
    url: https://www.findstat.org/St000017
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: AttackingInversionCount(tableau)
    description: "Attacking pairs of cells whose entries are out of order: the cell in the lower row, strictly east of the other, holds the larger entry."
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Pairs in a row are in order. Across rows, the lower cell's entry exceeds the entry above it, which exceeds the entry of the cell it attacks, so every such pair is an inversion (FindStat's St000017). The empty tableau gives 0.
