---
name: InverseGelfandTsetlinCycle
domain: Combinatorial maps
signature: InverseGelfandTsetlinCycle(GelfandTsetlinPattern)
summary: The crystal reflections s_1, ..., s_{m-1} applied in turn to the pattern's tableau.
catalog:
  - system: findstat
    identity: Mp00212
    url: https://www.findstat.org/Mp00212
    on: GelfandTsetlinPattern
mapOn:
  - GelfandTsetlinPattern
signatures:
  - call: InverseGelfandTsetlinCycle(GelfandTsetlinPattern)
    description: The crystal reflections s_1, ..., s_{m-1} applied in turn to the pattern's tableau.
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> gelfand_tsetlin_pattern
---

- Takes a `GelfandTsetlinPattern` and returns a `GelfandTsetlinPattern` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00212, the inverse of GelfandTsetlinCycle.
