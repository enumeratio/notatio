---
name: SkewPartition
domain: Combinatorics
signature: SkewPartition(...)
summary: Catalogued in the enumeratio database; not yet written up here.
catalogCarrier: true
stub: carrier
signatures:
  - call: SkewPartition(...)
    description: Catalogued in the enumeratio database; not yet written up here.
    library: enumeratio-combinatorics
    type: ((list<list<integer>>) -> skew_partition) & ((integer_partition) -> skew_partition) & ((composition) -> skew_partition) & ((dyck_path) -> skew_partition)
catalog:
  - system: findstat
    identity: Mp00179
    url: https://www.findstat.org/Mp00179
    on: IntegerPartition
  - system: findstat
    identity: Mp00180
    url: https://www.findstat.org/Mp00180
    on: IntegerComposition
  - system: findstat
    identity: Mp00233
    url: https://www.findstat.org/Mp00233
    on: DyckPath
---
