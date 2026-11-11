---
name: LewisLyuPylyavskyySenShape
domain: Combinatorial maps
signature: LewisLyuPylyavskyySenShape(Permutation)
summary: "The Lewis, Lyu, Pylyavskyy and Sen shape: the conjugate of the partition whose k-th part is how much a k-th disjoint run of ascents adds to the most the first k − 1 total."
catalog:
  - system: findstat
    identity: Mp00204
    url: https://www.findstat.org/Mp00204
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: LewisLyuPylyavskyySenShape(Permutation)
    description: "The Lewis, Lyu, Pylyavskyy and Sen shape: the conjugate of the partition whose k-th part is how much a k-th disjoint run of ascents adds to the most the first k − 1 total."
    library: enumeratio-combinatorics
    type: (permutation) -> integer_partition
---

- Takes a `Permutation` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00204, Sage's LLPS. A'_k = the most that k disjoint subsequences total in ascending runs, here by dynamic programming over the cut points of the reversed word (best[k][j] = max over i < j of best[k − 1][i] + the longest increasing subsequence of the block i + 1 .. j).
