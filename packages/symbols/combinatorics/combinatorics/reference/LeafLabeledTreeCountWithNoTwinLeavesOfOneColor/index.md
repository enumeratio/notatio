---
name: LeafLabeledTreeCountWithNoTwinLeavesOfOneColor
domain: Partition statistics
signature: LeafLabeledTreeCountWithNoTwinLeavesOfOneColor(partition)
summary: The rooted trees whose leaves are the colored vertices, internal vertices unlabeled and with at least two children, in which no internal vertex has only leaves of one color as its children.
catalog:
  - system: findstat
    identity: St001100
    url: https://www.findstat.org/St001100
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: LeafLabeledTreeCountWithNoTwinLeavesOfOneColor(partition)
    description: The rooted trees whose leaves are the colored vertices, internal vertices unlabeled and with at least two children, in which no internal vertex has only leaves of one color as its children.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
