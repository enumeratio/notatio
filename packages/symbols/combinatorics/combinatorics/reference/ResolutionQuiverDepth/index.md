---
name: ResolutionQuiverDepth
domain: Dyck path statistics
signature: ResolutionQuiverDepth(path)
summary: The greatest number of steps from a vertex to a cycle in the resolution quiver of the path's linear Nakayama algebra, where each vertex goes to its own index plus its Kupisch entry, around the vertices.
signatures:
  - call: ResolutionQuiverDepth(path)
    description: The greatest number of steps from a vertex to a cycle in the resolution quiver of the path's linear Nakayama algebra, where each vertex goes to its own index plus its Kupisch entry, around the vertices.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001503
    url: https://www.findstat.org/St001503
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001503.
