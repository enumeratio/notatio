---
name: BoxedAndCircledEntryCount
domain: Gelfand-Tsetlin pattern statistics
signature: BoxedAndCircledEntryCount(pattern)
summary: The entries equal to both entries above them.
catalog:
  - system: findstat
    identity: St000077
    url: https://www.findstat.org/St000077
    on: GelfandTsetlinPattern
statOn:
  - GelfandTsetlinPattern
signatures:
  - call: BoxedAndCircledEntryCount(pattern)
    description: The entries equal to both entries above them.
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> number
---

- Defined over `GelfandTsetlinPattern` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `GelfandTsetlinPattern` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000077. The empty pattern gives 0.
