---
name: NonZeroRadicalsOfProjectivesOfProjectiveAndInjectiveDimensionAtMostOne
domain: Dyck path statistics
signature: NonZeroRadicalsOfProjectivesOfProjectiveAndInjectiveDimensionAtMostOne(path)
summary: The nonzero radicals of the indecomposable projective modules whose projective and injective dimensions are both at most one.
catalog:
  - system: findstat
    identity: St001241
    url: https://www.findstat.org/St001241
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: NonZeroRadicalsOfProjectivesOfProjectiveAndInjectiveDimensionAtMostOne(path)
    description: The nonzero radicals of the indecomposable projective modules whose projective and injective dimensions are both at most one.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001241. The radical of the projective at vertex v starts at v + 1.
