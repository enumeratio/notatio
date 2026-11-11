---
name: ProperColoringSchemeCount
domain: Partition statistics
signature: ProperColoringSchemeCount(partition)
summary: The partitions of the number of cells that are the class sizes of a proper coloring of the cells with the fewest colors, no two cells in a row or a column alike.
catalog:
  - system: findstat
    identity: St000781
    url: https://www.findstat.org/St000781
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
