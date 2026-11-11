---
name: ChompGrundyValue
domain: Partition statistics
signature: ChompGrundyValue(partition)
summary: "The Grundy value of Chomp on the diagram: a move cuts a cell and all cells below and right of it, any cell but the first, and the player left with the first cell alone loses."
catalog:
  - system: findstat
    identity: St000681
    url: https://www.findstat.org/St000681
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
