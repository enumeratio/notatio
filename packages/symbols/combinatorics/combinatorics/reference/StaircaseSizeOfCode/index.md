---
name: StaircaseSizeOfCode
domain: Permutation statistics
signature: StaircaseSizeOfCode(p)
summary: The largest k with a subsequence of the Lehmer code whose j-th entry from the right is at least j.
catalog:
  - system: findstat
    identity: St000662
    url: https://www.findstat.org/St000662
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: StaircaseSizeOfCode(p)
    description: The largest k with a subsequence of the Lehmer code whose j-th entry from the right is at least j.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- Scanning the code from the right and taking each entry that exceeds the count so far is optimal.
