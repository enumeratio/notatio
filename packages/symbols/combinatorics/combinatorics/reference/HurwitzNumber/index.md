---
name: HurwitzNumber
domain: Partition statistics
signature: HurwitzNumber(partition)
summary: "Hurwitz's number for the partition: (n + c - 2)! n^(c-3) times the product of p^p / (p-1)! over its c parts p, n being its size."
catalog:
  - system: findstat
    identity: St001763
    url: https://www.findstat.org/St001763
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: HurwitzNumber(partition)
    description: "Hurwitz's number for the partition: (n + c - 2)! n^(c-3) times the product of p^p / (p-1)! over its c parts p, n being its size."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
