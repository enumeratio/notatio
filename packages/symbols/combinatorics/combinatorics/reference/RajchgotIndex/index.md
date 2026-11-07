---
name: RajchgotIndex
domain: Permutation statistics
signature: RajchgotIndex(p)
summary: The sum over positions i of n - i less the longest increasing subsequence of the larger entries after p(i).
catalog:
  - system: findstat
    identity: St001759
    url: https://www.findstat.org/St001759
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: RajchgotIndex(p)
    description: The sum over positions i of n - i less the longest increasing subsequence of the larger entries after p(i).
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- The degree of the Grothendieck polynomial, after Pechenik, Speyer and Weigandt.
