---
name: SetPartition
domain: Collections
signature: SetPartition(list)
summary: The singular-inhabitant constructor for a partition of a set, as its blocks.
references:
  - system: wikipedia
    identity: Partition of a set
  - system: mathworld
    identity: SetPartition
catalogCarrier: true
glyph: set-partition
signatures:
  - call: SetPartition(list)
    description: The singular-inhabitant constructor for a partition of a set, as its blocks.
    library: enumeratio-combinatorics
    type: ((list<list<integer>>) -> set_partition) & ((restricted_growth_string) -> set_partition) & ((perfect_matching) -> set_partition)
laws:
  - inverse: RestrictedGrowthString
  - orderIsomorphism:
      from: RestrictedGrowthStrings
      to: SetPartitions
catalog:
  - system: findstat
    identity: Mp00092
    url: https://www.findstat.org/Mp00092
    on: PerfectMatching
---

- Ordered by refinement: π is below σ when every block of π lies inside a block of σ. A lattice, so `Min` is the meet (common refinement) and `Max` the join (finest common coarsening), with `Compare` giving NaN for incomparable partitions.
