---
name: ThreeChainHomomorphismCount
domain: Poset statistics
signature: ThreeChainHomomorphismCount(poset)
summary: "The order-preserving maps to the chain of three elements: the pairs of nested order ideals."
catalog:
  - system: findstat
    identity: St001709
    url: https://www.findstat.org/St001709
    on: Poset
statOn:
  - Poset
signatures:
  - call: ThreeChainHomomorphismCount(poset)
    description: "The order-preserving maps to the chain of three elements: the pairs of nested order ideals."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `Length(_x) <= 11` holds; elsewhere the call stays unevaluated.
- FindStat's St001709. The poset with no elements gives 1, the empty map, a convention: FindStat has no row for it.
