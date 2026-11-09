---
name: InverseRotation
domain: Combinatorial maps
signature: InverseRotation(PerfectMatching)
summary: The matching with every point i replaced by i - 1, and 1 by 2m.
catalog:
  - system: findstat
    identity: Mp00145
    url: https://www.findstat.org/Mp00145
    on: PerfectMatching
mapOn:
  - PerfectMatching
signatures:
  - call: InverseRotation(PerfectMatching)
    description: The matching with every point i replaced by i - 1, and 1 by 2m.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> perfect_matching
---

- Takes a `PerfectMatching` and returns a `PerfectMatching` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00145, the inverse of Rotation.
