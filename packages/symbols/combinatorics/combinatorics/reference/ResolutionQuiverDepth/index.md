---
name: ResolutionQuiverDepth
domain: Dyck path statistics
signature: ResolutionQuiverDepth(path)
summary: The greatest number of steps from a vertex to a cycle in the resolution quiver of the path's linear Nakayama algebra, where each vertex goes to its own index plus its Kupisch entry, around the vertices.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001503.
