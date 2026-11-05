---
name: MonotoneHurwitzNumber
domain: Partition statistics
signature: MonotoneHurwitzNumber(partition)
summary: "The monotone factorizations of genus zero of a permutation of this cycle type into transpositions: the product of the Catalan numbers C(p - 1) over the parts p."
catalog:
  - system: findstat
    identity: St001934
    url: https://www.findstat.org/St001934
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: MonotoneHurwitzNumber(partition)
    description: "The monotone factorizations of genus zero of a permutation of this cycle type into transpositions: the product of the Catalan numbers C(p - 1) over the parts p."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The cycles factor independently, and the larger entries of the transpositions, weakly increasing, fix how the factors interleave.
