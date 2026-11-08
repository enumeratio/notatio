---
name: LargestEntry
domain: Semistandard tableau statistics
signature: LargestEntry(tableau)
summary: The largest entry.
catalog:
  - system: findstat
    identity: St001409
    url: https://www.findstat.org/St001409
    on: SemistandardTableau
statOn:
  - SemistandardTableau
signatures:
  - call: LargestEntry(tableau)
    description: The largest entry.
    library: enumeratio-combinatorics
    type: (semistandard_tableau) -> number
---

- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001409. The empty tableau gives 0.
