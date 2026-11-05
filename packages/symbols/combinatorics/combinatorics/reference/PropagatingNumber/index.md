---
name: PropagatingNumber
domain: Set partition statistics
signature: PropagatingNumber(partition)
summary: Pairs with one point among the first n and the other among the last n, for a matching of 2n points.
catalog:
  - system: findstat
    identity: St000819
    url: https://www.findstat.org/St000819
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: PropagatingNumber(partition)
    description: Pairs with one point among the first n and the other among the last n, for a matching of 2n points.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
