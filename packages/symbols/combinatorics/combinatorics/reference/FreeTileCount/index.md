---
name: FreeTileCount
domain: Gelfand-Tsetlin pattern statistics
signature: FreeTileCount(pattern)
summary: The tiles that meet neither the first row nor the last.
catalog:
  - system: findstat
    identity: St000177
    url: https://www.findstat.org/St000177
    on: GelfandTsetlinPattern
statOn:
  - GelfandTsetlinPattern
signatures:
  - call: FreeTileCount(pattern)
    description: The tiles that meet neither the first row nor the last.
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> number
---

- Defined over `GelfandTsetlinPattern` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `GelfandTsetlinPattern` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000177. A tile is labeled by its first place, which is in the first row exactly when the tile meets it; the last row is the single place at the end. The empty pattern gives 0.
