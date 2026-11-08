---
name: StandardizedMajorIndex
domain: Semistandard tableau statistics
signature: StandardizedMajorIndex(tableau)
summary: "The major index of the reading word of the standardization: the sum, over the rows with a row below, of the cells from the row below on, where the last entry of that row is at least the first of this one."
catalog:
  - system: findstat
    identity: St000116
    url: https://www.findstat.org/St000116
    on: SemistandardTableau
statOn:
  - SemistandardTableau
signatures:
  - call: StandardizedMajorIndex(tableau)
    description: "The major index of the reading word of the standardization: the sum, over the rows with a row below, of the cells from the row below on, where the last entry of that row is at least the first of this one."
    library: enumeratio-combinatorics
    type: (semistandard_tableau) -> number
---

- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000116. Equal entries are numbered left to right, and the reading word lists the rows from the bottom up, so the boundary between a row and the row above it is a descent exactly when the last entry below is at least the first entry above (a last entry equal to it lies to the right of the first). Inside a row there is no descent. A tableau of one row gives 0.
