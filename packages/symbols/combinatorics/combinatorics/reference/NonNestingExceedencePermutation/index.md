---
name: NonNestingExceedencePermutation
domain: Combinatorial maps
signature: NonNestingExceedencePermutation(PerfectMatching)
summary: The fixed point free permutation with the matching's deficiencies, no alignments and no inversions between exceedences.
catalog:
  - system: findstat
    identity: Mp00283
    url: https://www.findstat.org/Mp00283
    on: PerfectMatching
mapOn:
  - PerfectMatching
signatures:
  - call: NonNestingExceedencePermutation(PerfectMatching)
    description: The fixed point free permutation with the matching's deficiencies, no alignments and no inversions between exceedences.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> permutation
---

- Takes a `PerfectMatching` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00283, an injection: the exceedences are the unique non-nesting matching with the same openers.
