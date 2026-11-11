---
name: ColoredRootedTreeCount
domain: Partition statistics
signature: ColoredRootedTreeCount(partition)
summary: The rooted trees, unordered and unlabeled, on vertices colored with these multiplicities, vertices of one color being interchangeable.
catalog:
  - system: findstat
    identity: St001608
    url: https://www.findstat.org/St001608
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
