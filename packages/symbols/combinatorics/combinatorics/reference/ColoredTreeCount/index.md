---
name: ColoredTreeCount
domain: Partition statistics
signature: ColoredTreeCount(partition)
summary: The trees, unrooted and unlabeled, on vertices colored with these multiplicities, vertices of one color being interchangeable.
catalog:
  - system: findstat
    identity: St001609
    url: https://www.findstat.org/St001609
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
