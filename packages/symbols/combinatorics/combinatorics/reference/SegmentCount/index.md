---
name: SegmentCount
domain: Semistandard tableau statistics
signature: SegmentCount(tableau)
summary: "The segments: maximal runs of equal entries in a row, other than the entries equal to the row's own number."
catalog:
  - system: findstat
    identity: St000173
    url: https://www.findstat.org/St000173
    on: SemistandardTableau
statOn:
  - SemistandardTableau
signatures:
  - call: SegmentCount(tableau)
    description: "The segments: maximal runs of equal entries in a row, other than the entries equal to the row's own number."
    library: enumeratio-combinatorics
    type: (semistandard_tableau) -> number
---

- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000173, the segment statistic. A row weakly increases, so a run of equal entries starts at the first column or where the entry rises. The empty tableau gives 0.
