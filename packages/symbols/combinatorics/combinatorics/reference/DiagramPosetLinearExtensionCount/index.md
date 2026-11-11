---
name: DiagramPosetLinearExtensionCount
domain: Partition statistics
signature: DiagramPosetLinearExtensionCount(partition)
summary: The linear extensions of the poset on the diagram (Speyer's construction for the homogeneous Garnir relations), counted by the splitting of the diagram at its lowest cell on the longest antidiagonal into the rows below and the columns beyond.
catalog:
  - system: findstat
    identity: St000063
    url: https://www.findstat.org/St000063
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
