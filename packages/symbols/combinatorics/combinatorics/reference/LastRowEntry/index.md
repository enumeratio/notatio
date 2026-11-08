---
name: LastRowEntry
domain: Gelfand-Tsetlin pattern statistics
signature: LastRowEntry(pattern)
summary: The single entry of the last row.
catalog:
  - system: findstat
    identity: St000115
    url: https://www.findstat.org/St000115
    on: GelfandTsetlinPattern
statOn:
  - GelfandTsetlinPattern
signatures:
  - call: LastRowEntry(pattern)
    description: The single entry of the last row.
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> number
---

- Defined over `GelfandTsetlinPattern` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `GelfandTsetlinPattern` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000115. The empty pattern gives 0.
