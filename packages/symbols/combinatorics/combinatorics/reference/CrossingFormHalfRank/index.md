---
name: CrossingFormHalfRank
domain: Perfect matching statistics
signature: CrossingFormHalfRank(matching)
summary: Half the rank of the skew-symmetric matrix on the pairs that is 1 where a pair (a, b) crosses a pair (c, d) with a < c < b < d, and -1 where it is crossed the other way.
catalog:
  - system: findstat
    identity: St001444
    url: https://www.findstat.org/St001444
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: CrossingFormHalfRank(matching)
    description: Half the rank of the skew-symmetric matrix on the pairs that is 1 where a pair (a, b) crosses a pair (c, d) with a < c < b < d, and -1 where it is crossed the other way.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001444. The rank of a skew-symmetric matrix is even, so the half is exact.
