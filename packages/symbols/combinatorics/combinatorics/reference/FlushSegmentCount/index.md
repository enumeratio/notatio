---
name: FlushSegmentCount
domain: Semistandard tableau statistics
signature: FlushSegmentCount(tableau)
summary: The flush segments, counted as FindStat's reference code counts them.
catalog:
  - system: findstat
    identity: St000174
    url: https://www.findstat.org/St000174
    on: SemistandardTableau
statOn:
  - SemistandardTableau
signatures:
  - call: FlushSegmentCount(tableau)
    description: The flush segments, counted as FindStat's reference code counts them.
    library: enumeratio-combinatorics
    type: (semistandard_tableau) -> number
---

- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000174, the flush statistic, defined by its Sage code (the prose describes a narrower tableau). Each segment counts once if it is in the last row and starts at column 1; otherwise once if the row below has a segment starting in the same column, and once more if it starts just past the end of the row below and that row's last entry is at most its entry. The empty tableau gives 0.
