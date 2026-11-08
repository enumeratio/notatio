---
name: SpecialEntryCount
domain: Gelfand-Tsetlin pattern statistics
signature: SpecialEntryCount(pattern)
summary: "The entries strictly between the entries up and to the left and up and to the right of them: neither boxed nor circled."
catalog:
  - system: findstat
    identity: St000074
    url: https://www.findstat.org/St000074
    on: GelfandTsetlinPattern
statOn:
  - GelfandTsetlinPattern
signatures:
  - call: SpecialEntryCount(pattern)
    description: "The entries strictly between the entries up and to the left and up and to the right of them: neither boxed nor circled."
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> number
---

- Defined over `GelfandTsetlinPattern` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `GelfandTsetlinPattern` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000074. An entry lies between its two upper neighbors, so it is boxed, circled, both or special. The empty pattern gives 0.
