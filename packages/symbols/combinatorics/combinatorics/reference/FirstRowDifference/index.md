---
name: FirstRowDifference
domain: Gelfand-Tsetlin pattern statistics
signature: FirstRowDifference(pattern)
summary: "The first entry of the first row less its last: the largest entry less the smallest of the top row."
catalog:
  - system: findstat
    identity: St001713
    url: https://www.findstat.org/St001713
    on: GelfandTsetlinPattern
statOn:
  - GelfandTsetlinPattern
signatures:
  - call: FirstRowDifference(pattern)
    description: "The first entry of the first row less its last: the largest entry less the smallest of the top row."
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> number
---

- Defined over `GelfandTsetlinPattern` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `GelfandTsetlinPattern` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001713. The first row weakly decreases, so the difference is never negative. The empty pattern gives 0.
