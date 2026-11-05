---
name: IdentityMatchingEdgeCount
domain: Set partition statistics
signature: IdentityMatchingEdgeCount(partition)
summary: "Pairs {2k - 1, 2k}: the edges shared with the matching 12, 34, 56, ...."
catalog:
  - system: findstat
    identity: St001997
    url: https://www.findstat.org/St001997
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: IdentityMatchingEdgeCount(partition)
    description: "Pairs {2k - 1, 2k}: the edges shared with the matching 12, 34, 56, ...."
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001997. The identity matching is 12, 34, 56, ....
