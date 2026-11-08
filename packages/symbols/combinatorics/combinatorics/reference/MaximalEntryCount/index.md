---
name: MaximalEntryCount
domain: Semistandard tableau statistics
signature: MaximalEntryCount(tableau)
summary: "The entries that cannot be replaced by a larger one: an entry equal to its right neighbor, or one less than its neighbor below."
catalog:
  - system: findstat
    identity: St001408
    url: https://www.findstat.org/St001408
    on: SemistandardTableau
statOn:
  - SemistandardTableau
signatures:
  - call: MaximalEntryCount(tableau)
    description: "The entries that cannot be replaced by a larger one: an entry equal to its right neighbor, or one less than its neighbor below."
    library: enumeratio-combinatorics
    type: (semistandard_tableau) -> number
---

- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001408. Raising an entry by one keeps the tableau semistandard unless its right neighbor equals it or its neighbor below is one more; there is no bound on the entries. The empty tableau gives 0.
