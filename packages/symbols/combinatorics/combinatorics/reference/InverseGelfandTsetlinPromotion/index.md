---
name: InverseGelfandTsetlinPromotion
domain: Combinatorial maps
signature: InverseGelfandTsetlinPromotion(GelfandTsetlinPattern)
summary: "Inverse promotion of the pattern's tableau: the entries 1 are removed, the rest slide inward, and every entry shrinks by one."
catalog:
  - system: findstat
    identity: Mp00211
    url: https://www.findstat.org/Mp00211
    on: GelfandTsetlinPattern
mapOn:
  - GelfandTsetlinPattern
signatures:
  - call: InverseGelfandTsetlinPromotion(GelfandTsetlinPattern)
    description: "Inverse promotion of the pattern's tableau: the entries 1 are removed, the rest slide inward, and every entry shrinks by one."
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> gelfand_tsetlin_pattern
---

- Takes a `GelfandTsetlinPattern` and returns a `GelfandTsetlinPattern` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00211, the inverse of GelfandTsetlinPromotion. Computed as the Bender-Knuth involutions t_1, ..., t_{m-1} in turn.
