---
name: JumpNumber
domain: Poset statistics
signature: JumpNumber(poset)
summary: "The fewest jumps over the linear extensions: the steps where the next element does not cover the last."
catalog:
  - system: findstat
    identity: St000632
    url: https://www.findstat.org/St000632
    on: Poset
statOn:
  - Poset
signatures:
  - call: JumpNumber(poset)
    description: "The fewest jumps over the linear extensions: the steps where the next element does not cover the last."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000632. A table over the order ideals and their last element. The poset with no elements gives 0, a convention: FindStat has no row for it.
