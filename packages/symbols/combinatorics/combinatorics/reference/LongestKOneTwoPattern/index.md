---
name: LongestKOneTwoPattern
domain: Permutation statistics
signature: LongestKOneTwoPattern(p)
summary: "The largest k such that p has an occurrence of k 1 2 ... (k-1): a first entry above an increasing run of later, smaller ones."
catalog:
  - system: findstat
    identity: St000451
    url: https://www.findstat.org/St000451
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: LongestKOneTwoPattern(p)
    description: "The largest k such that p has an occurrence of k 1 2 ... (k-1): a first entry above an increasing run of later, smaller ones."
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
