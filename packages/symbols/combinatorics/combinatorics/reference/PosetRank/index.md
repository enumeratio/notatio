---
name: PosetRank
domain: Poset statistics
signature: PosetRank(poset)
summary: "The length of the longest chain: one less than the elements it holds."
catalog:
  - system: findstat
    identity: St000080
    url: https://www.findstat.org/St000080
    on: Poset
statOn:
  - Poset
signatures:
  - call: PosetRank(poset)
    description: "The length of the longest chain: one less than the elements it holds."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000080. The poset with no elements gives -1.
