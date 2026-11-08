---
name: TileCount
domain: Gelfand-Tsetlin pattern statistics
signature: TileCount(pattern)
summary: "The tiles: the classes of entries joined by equal entries in adjacent places, up, down, left or right in the triangle."
catalog:
  - system: findstat
    identity: St000176
    url: https://www.findstat.org/St000176
    on: GelfandTsetlinPattern
statOn:
  - GelfandTsetlinPattern
signatures:
  - call: TileCount(pattern)
    description: "The tiles: the classes of entries joined by equal entries in adjacent places, up, down, left or right in the triangle."
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern) -> number
---

- Defined over `GelfandTsetlinPattern` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `GelfandTsetlinPattern` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000176. A tile is a connected set of equal entries, labeled by its first place in the reading. Adjacent places are the two below an entry and the two above it, not its neighbors in a row. The empty pattern gives 0.
