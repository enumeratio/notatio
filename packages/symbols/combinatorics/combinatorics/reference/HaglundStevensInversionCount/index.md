---
name: HaglundStevensInversionCount
domain: Tableau statistics
signature: HaglundStevensInversionCount(tableau)
summary: The pairs of a cell's entry and a smaller entry lying below the cell's inversion path, over all cells.
signatures:
  - call: HaglundStevensInversionCount(tableau)
    description: The pairs of a cell's entry and a smaller entry lying below the cell's inversion path, over all cells.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
catalog:
  - system: findstat
    identity: St000059
    url: https://www.findstat.org/St000059
    on: StandardTableau
statOn:
  - StandardTableau
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000059, Haglund and Stevens's inversion number. The inversion path of a cell leaves it up when the entry above is larger than the entry to the left, else left, until it reaches the first column (and then runs straight up) or the first row; the cells below the path in a row are those from the path's column on. A path has fewer than n steps and stays put once it ends.
