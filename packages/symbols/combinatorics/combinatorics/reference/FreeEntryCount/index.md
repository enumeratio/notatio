---
name: FreeEntryCount
domain: Gelfand-Tsetlin pattern statistics
signature: FreeEntryCount(pattern)
summary: The entries in tiles that meet neither the first row nor the last.
catalog:
  - system: findstat
    identity: St000178
    url: https://www.findstat.org/St000178
    on: GelfandTsetlinPattern
statOn:
  - GelfandTsetlinPattern
signatures:
  - call: FreeEntryCount(pattern)
    description: The entries in tiles that meet neither the first row nor the last.
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> number
---

- Defined over `GelfandTsetlinPattern` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `GelfandTsetlinPattern` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000178. The empty pattern gives 0.
