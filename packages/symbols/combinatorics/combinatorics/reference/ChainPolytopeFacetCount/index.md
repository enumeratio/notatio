---
name: ChainPolytopeFacetCount
domain: Poset statistics
signature: ChainPolytopeFacetCount(poset)
summary: "The facets of the chain polytope: the elements and the maximal chains."
catalog:
  - system: findstat
    identity: St000151
    url: https://www.findstat.org/St000151
    on: Poset
statOn:
  - Poset
signatures:
  - call: ChainPolytopeFacetCount(poset)
    description: "The facets of the chain polytope: the elements and the maximal chains."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000151, held to its rows only, which stop at 6 elements: the closed form, the elements plus the paths up the Hasse diagram from a minimal to a maximal element, is not read from the polytope. The poset with no elements gives 0, a convention: FindStat has no row for it.
