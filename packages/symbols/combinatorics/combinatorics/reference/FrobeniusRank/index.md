---
name: FrobeniusRank
domain: Skew partition statistics
signature: FrobeniusRank(shape)
summary: The fewest border strips that the shape divides into.
catalog:
  - system: findstat
    identity: St001597
    url: https://www.findstat.org/St001597
    on: SkewPartition
statOn:
  - SkewPartition
signatures:
  - call: FrobeniusRank(shape)
    description: The fewest border strips that the shape divides into.
    library: enumeratio-combinatorics
    type: (skew_partition) -> number
---

- Defined over `SkewPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SkewPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001597. A strip is a path of cells going up or right, so the fewest strips are the cells less the most pairs of neighbors that no cell takes twice as the one before and as the one after. Those pairs lie between consecutive diagonals, in runs, and a run of m cells gives floor(m / 2). A connected shape of one strip is a border strip. The empty shape gives 0.
