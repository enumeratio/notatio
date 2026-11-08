---
name: TableauFactorCount
domain: Tableau statistics
signature: TableauFactorCount(tableau)
summary: "The factors the tableau splits into under concatenation: 1 more than the cuts i after which the entries above i, less i, are a standard tableau."
catalog:
  - system: findstat
    identity: St001462
    url: https://www.findstat.org/St001462
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: TableauFactorCount(tableau)
    description: "The factors the tableau splits into under concatenation: 1 more than the cuts i after which the entries above i, less i, are a standard tableau."
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001462. Concatenation lays the second tableau's rows below the first's, with the first's largest entry added to them. The empty tableau has no factors.
