---
name: ShortestMaximalAntichainSize
domain: Poset statistics
signature: ShortestMaximalAntichainSize(poset)
summary: The fewest elements in a maximal antichain.
catalog:
  - system: findstat
    identity: St000908
    url: https://www.findstat.org/St000908
    on: Poset
statOn:
  - Poset
signatures:
  - call: ShortestMaximalAntichainSize(poset)
    description: The fewest elements in a maximal antichain.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `Length(_x) <= 12` holds; elsewhere the call stays unevaluated.
- FindStat's St000908, whose title says the length of the antichain: its rows count its elements. The poset with no elements gives 0, a convention: FindStat has no row for it.
