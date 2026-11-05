---
name: BabsonSteingrimssonStatisticPrime
domain: Permutation statistics
signature: BabsonSteingrimssonStatisticPrime(p)
summary: Descents plus the occurrences of the vincular patterns 13-2, 31-2 and 32-1.
catalog:
  - system: findstat
    identity: St000796
    url: https://www.findstat.org/St000796
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: BabsonSteingrimssonStatisticPrime(p)
    description: Descents plus the occurrences of the vincular patterns 13-2, 31-2 and 32-1.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- FindStat's stat', after Babson and Steingrimsson.
