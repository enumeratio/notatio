---
name: SmallestEntry
domain: Semistandard tableau statistics
signature: SmallestEntry(tableau)
summary: "The smallest entry: the first of the first row."
catalog:
  - system: findstat
    identity: St001410
    url: https://www.findstat.org/St001410
    on: SemistandardTableau
statOn:
  - SemistandardTableau
signatures:
  - call: SmallestEntry(tableau)
    description: "The smallest entry: the first of the first row."
    library: enumeratio-combinatorics
    type: (semistandard_tableau) -> number
---

- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001410. The empty tableau gives 0.
