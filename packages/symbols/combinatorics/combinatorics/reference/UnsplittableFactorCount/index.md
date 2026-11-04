---
name: UnsplittableFactorCount
domain: Set partition statistics
signature: UnsplittableFactorCount(partition)
summary: The number of unsplittable factors of the set partition under the split product.
catalog:
  - system: findstat
    identity: St000823
    url: https://www.findstat.org/St000823
    on: SetPartition
statOn:
  - SetPartition
signatures:
  - call: UnsplittableFactorCount(partition)
    description: The number of unsplittable factors of the set partition under the split product.
    library: enumeratio-combinatorics
    type: (set_partition) -> number
---

- Defined over `SetPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SetPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000823. The split product of set partitions of m and n glues the i-th block of the first to the i-th block of the second, shifted by m.
