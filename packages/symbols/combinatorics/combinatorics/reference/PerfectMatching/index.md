---
name: PerfectMatching
domain: Combinatorics
signature: PerfectMatching(...)
summary: Catalogued in the enumeratio database; not yet written up here.
catalogCarrier: true
stub: carrier
signatures:
  - call: PerfectMatching(...)
    description: Catalogued in the enumeratio database; not yet written up here.
    library: enumeratio-combinatorics
    type: ((list<list<integer>>) -> perfect_matching) & ((alternating_sign_matrix) -> perfect_matching) & ((dyck_path) -> perfect_matching)
catalog:
  - system: findstat
    identity: Mp00098
    url: https://www.findstat.org/Mp00098
    on: AlternatingSignMatrix
  - system: findstat
    identity: Mp00146
    url: https://www.findstat.org/Mp00146
    on: DyckPath
---
