---
name: ColoredEndofunctionCount
domain: Partition statistics
signature: ColoredEndofunctionCount(partition)
summary: The endofunctions, up to relabeling, on points colored with these multiplicities, points of one color being interchangeable.
catalog:
  - system: findstat
    identity: St001610
    url: https://www.findstat.org/St001610
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
