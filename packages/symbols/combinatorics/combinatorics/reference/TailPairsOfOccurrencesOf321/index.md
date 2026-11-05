---
name: TailPairsOfOccurrencesOf321
domain: Permutation statistics
signature: TailPairsOfOccurrencesOf321(p)
summary: Pairs j < k with p(j) > p(k) and some entry before j above p(j), the positions of the 2 and the 1 of the occurrences of 321.
catalog:
  - system: findstat
    identity: St000123
    url: https://www.findstat.org/St000123
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: TailPairsOfOccurrencesOf321(p)
    description: Pairs j < k with p(j) > p(k) and some entry before j above p(j), the positions of the 2 and the 1 of the occurrences of 321.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
