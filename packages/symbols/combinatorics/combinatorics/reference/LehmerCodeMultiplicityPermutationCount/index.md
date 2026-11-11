---
name: LehmerCodeMultiplicityPermutationCount
domain: Partition statistics
signature: LehmerCodeMultiplicityPermutationCount(partition)
summary: The permutations of the size whose Lehmer code takes its values with these multiplicities, the nonzero multiplicities of its values being the parts.
catalog:
  - system: findstat
    identity: St000275
    url: https://www.findstat.org/St000275
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
