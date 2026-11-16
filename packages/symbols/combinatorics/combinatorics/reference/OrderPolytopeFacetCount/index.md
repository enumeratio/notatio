---
name: OrderPolytopeFacetCount
domain: Poset statistics
signature: OrderPolytopeFacetCount(poset)
summary: "The facets of the order polytope: one for each cover, each minimal element and each maximal element."
catalog:
  - system: findstat
    identity: St000104
    url: https://www.findstat.org/St000104
    on: Poset
statOn:
  - Poset
signatures:
  - call: OrderPolytopeFacetCount(poset)
    description: "The facets of the order polytope: one for each cover, each minimal element and each maximal element."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000104. The poset with no elements gives 0.
