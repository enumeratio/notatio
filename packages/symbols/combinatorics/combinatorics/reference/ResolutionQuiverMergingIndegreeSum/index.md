---
name: ResolutionQuiverMergingIndegreeSum
domain: Dyck path statistics
signature: ResolutionQuiverMergingIndegreeSum(path)
summary: The sum of the indegrees of the vertices of the resolution quiver of the path's linear Nakayama algebra that have indegree at least two.
signatures:
  - call: ResolutionQuiverMergingIndegreeSum(path)
    description: The sum of the indegrees of the vertices of the resolution quiver of the path's linear Nakayama algebra that have indegree at least two.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001504
    url: https://www.findstat.org/St001504
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001504.
