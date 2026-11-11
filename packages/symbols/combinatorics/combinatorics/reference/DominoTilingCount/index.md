---
name: DominoTilingCount
domain: Partition statistics
signature: DominoTilingCount(partition)
summary: The tilings of the diagram by single cells and dominoes, the dominoes of two adjacent cells, whether in a row or a column.
catalog:
  - system: findstat
    identity: St001380
    url: https://www.findstat.org/St001380
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
