---
name: GelfandTsetlinCycle
domain: Combinatorial maps
signature: GelfandTsetlinCycle(GelfandTsetlinPattern)
summary: The crystal reflections s_{m-1}, ..., s_1 applied in turn to the pattern's tableau.
catalog:
  - system: findstat
    identity: Mp00213
    url: https://www.findstat.org/Mp00213
    on: GelfandTsetlinPattern
mapOn:
  - GelfandTsetlinPattern
signatures:
  - call: GelfandTsetlinCycle(GelfandTsetlinPattern)
    description: The crystal reflections s_{m-1}, ..., s_1 applied in turn to the pattern's tableau.
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> gelfand_tsetlin_pattern
---

- Takes a `GelfandTsetlinPattern` and returns a `GelfandTsetlinPattern` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00213, the inverse of InverseGelfandTsetlinCycle. A reflection s_i swaps the numbers of unmatched i's and (i + 1)'s in the row reading word (each i + 1 matched with a later i). Agrees with GelfandTsetlinPromotion on small patterns but not in general.
