---
name: RootedTreeCountWithNoLeafOfItsParentsColor
domain: Partition statistics
signature: RootedTreeCountWithNoLeafOfItsParentsColor(partition)
summary: "The rooted trees on these colored vertices, told apart by position within a color, in which no leaf has the color of its parent: n^(n-1) trees counted by the formal group law of x exp(-x)."
catalog:
  - system: findstat
    identity: St001098
    url: https://www.findstat.org/St001098
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
