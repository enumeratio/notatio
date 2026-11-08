---
name: CircledEntryCount
domain: Gelfand-Tsetlin pattern statistics
signature: CircledEntryCount(pattern)
summary: The entries equal to the entry up and to the right of them.
catalog:
  - system: findstat
    identity: St000072
    url: https://www.findstat.org/St000072
    on: GelfandTsetlinPattern
statOn:
  - GelfandTsetlinPattern
signatures:
  - call: CircledEntryCount(pattern)
    description: The entries equal to the entry up and to the right of them.
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> number
---

- Defined over `GelfandTsetlinPattern` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `GelfandTsetlinPattern` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000072. The first row has no entries above it. The empty pattern gives 0.
