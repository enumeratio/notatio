---
name: MinimalEntryCount
domain: Semistandard tableau statistics
signature: MinimalEntryCount(tableau)
summary: "The entries that cannot be replaced by a smaller one: an entry of 1, or one equal to its left neighbor, or one more than its neighbor above."
catalog:
  - system: findstat
    identity: St001407
    url: https://www.findstat.org/St001407
    on: SemistandardTableau
statOn:
  - SemistandardTableau
signatures:
  - call: MinimalEntryCount(tableau)
    description: "The entries that cannot be replaced by a smaller one: an entry of 1, or one equal to its left neighbor, or one more than its neighbor above."
    library: enumeratio-combinatorics
    type: (semistandard_tableau) -> number
---

- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001407. Lowering an entry by one keeps the tableau semistandard unless the entry is 1, or its left neighbor equals it, or its neighbor above is one less (the cells right and below it stay larger). The empty tableau gives 0.
