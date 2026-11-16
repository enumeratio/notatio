---
name: AntichainCount
domain: Poset statistics
signature: AntichainCount(poset)
summary: The sets of pairwise incomparable elements, the empty set included.
catalog:
  - system: findstat
    identity: St000070
    url: https://www.findstat.org/St000070
    on: Poset
statOn:
  - Poset
signatures:
  - call: AntichainCount(poset)
    description: The sets of pairwise incomparable elements, the empty set included.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000070. The poset with no elements gives 1, the empty antichain.
