---
name: TransposePartition
domain: Combinatorial maps
signature: TransposePartition(IntegerPartition)
summary: "The conjugate partition: column i of the Ferrers diagram becomes row i."
catalog:
  - system: findstat
    identity: Mp00044
    url: https://www.findstat.org/Mp00044
    on: IntegerPartition
  - system: sage
    identity: "Partitions(n).map(lambda p: p.conjugate())"
    url: https://doc.sagemath.org/html/en/reference/combinat/sage/combinat/partition.html
    note: real running construction, not just the bare Partition.conjugate property; verified live n=4 term-for-term against integer_partitions' own conjugate map
    on: IntegerPartition
mapOn:
  - CorePartition
  - IntegerPartition
signatures:
  - call: TransposePartition(IntegerPartition)
    description: "The conjugate partition: column i of the Ferrers diagram becomes row i."
    library: enumeratio-combinatorics
    type: ((core_partition) -> core_partition) & ((integer_partition) -> integer_partition)
laws:
  - involution
bindings:
  - origin: mapped
    form: combinatorica
    template: TransposePartition[$1]
    arity: 1
---

- Takes an `IntegerPartition` or a `CorePartition` and returns the same carrier — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- Entry i of the result counts the parts that are at least i, so it is its own inverse and swaps the number of parts with the largest part. Combinatorica's TransposePartition; FindStat's Mp00044, "conjugate". Wolfram's Conjugate is the complex conjugate, not this map.
- The conjugate of a core is a core of the same t, since a hook and its mirror have the same length: `CorePartition` is the same map with its answer kept in the carrier of cores.
