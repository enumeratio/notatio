---
name: GreedyLinearExtensionCount
domain: Poset statistics
signature: GreedyLinearExtensionCount(poset)
summary: "The sequences the greedy algorithm builds: a minimal element of the rest that covers the last chosen, else any minimal element."
catalog:
  - system: findstat
    identity: St001105
    url: https://www.findstat.org/St001105
    on: Poset
statOn:
  - Poset
signatures:
  - call: GreedyLinearExtensionCount(poset)
    description: "The sequences the greedy algorithm builds: a minimal element of the rest that covers the last chosen, else any minimal element."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001105. A table over the order ideals and their last element. The poset with no elements gives 1, the empty sequence, a convention: FindStat has no row for it.
