---
name: AlignedPairCount
domain: Set partition statistics
signature: AlignedPairCount(partition)
summary: Pairs of pairs (a, b), (c, d) with a < b < c < d.
catalog:
  - system: findstat
    identity: St000719
    url: https://www.findstat.org/St000719
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: AlignedPairCount(partition)
    description: Pairs of pairs (a, b), (c, d) with a < b < c < d.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000719, its alignments. Any two pairs cross, nest or align, so the three counts sum to n choose 2.
