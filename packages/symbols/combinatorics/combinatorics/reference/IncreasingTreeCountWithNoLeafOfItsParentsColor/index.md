---
name: IncreasingTreeCountWithNoLeafOfItsParentsColor
domain: Partition statistics
signature: IncreasingTreeCountWithNoLeafOfItsParentsColor(partition)
summary: The increasing trees on the vertices 1 .. n, colored in blocks with these multiplicities, in which no leaf has the color of its parent.
catalog:
  - system: findstat
    identity: St001101
    url: https://www.findstat.org/St001101
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
