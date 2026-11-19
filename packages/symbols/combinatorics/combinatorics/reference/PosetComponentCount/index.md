---
name: PosetComponentCount
domain: Poset statistics
signature: PosetComponentCount(poset)
summary: The connected components of the Hasse diagram.
catalog:
  - system: findstat
    identity: St000181
    url: https://www.findstat.org/St000181
    on: Poset
statOn:
  - Poset
signatures:
  - call: PosetComponentCount(poset)
    description: The connected components of the Hasse diagram.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000181. The poset with no elements gives 0.
