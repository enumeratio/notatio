---
name: ConjugateTrace
domain: Plane partition statistics
signature: ConjugateTrace(planePartition)
summary: The entries at least as large as their row number.
catalog:
  - system: findstat
    identity: St001923
    url: https://www.findstat.org/St001923
    on: PlanePartition
statOn:
  - PlanePartition
signatures:
  - call: ConjugateTrace(planePartition)
    description: The entries at least as large as their row number.
    library: enumeratio-combinatorics
    type: (plane_partition) -> number
---

- Defined over `PlanePartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PlanePartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001923.
