---
name: GelfandTsetlinPromotion
domain: Combinatorial maps
signature: GelfandTsetlinPromotion(GelfandTsetlinPattern)
summary: "Promotion of the pattern's tableau: the largest entries are removed, the rest slide outward, and every entry grows by one."
catalog:
  - system: findstat
    identity: Mp00210
    url: https://www.findstat.org/Mp00210
    on: GelfandTsetlinPattern
mapOn:
  - GelfandTsetlinPattern
signatures:
  - call: GelfandTsetlinPromotion(GelfandTsetlinPattern)
    description: "Promotion of the pattern's tableau: the largest entries are removed, the rest slide outward, and every entry grows by one."
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> gelfand_tsetlin_pattern
---

- Takes a `GelfandTsetlinPattern` and returns a `GelfandTsetlinPattern` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00210, the inverse of InverseGelfandTsetlinPromotion. Computed as the Bender-Knuth involutions t_{m-1}, ..., t_1 in turn; the width stays m.
