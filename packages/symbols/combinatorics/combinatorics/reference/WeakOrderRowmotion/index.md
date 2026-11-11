---
name: WeakOrderRowmotion
domain: Combinatorial maps
signature: WeakOrderRowmotion(Permutation)
summary: "Rowmotion on the weak order: the reversal of the permutation whose Laguerre heap is the inverse of the input's, the heap's pieces being the descending runs."
catalog:
  - system: findstat
    identity: Mp00326
    url: https://www.findstat.org/Mp00326
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: WeakOrderRowmotion(Permutation)
    description: "Rowmotion on the weak order: the reversal of the permutation whose Laguerre heap is the inverse of the input's, the heap's pieces being the descending runs."
    library: enumeratio-combinatorics
    type: (permutation) -> permutation
---

- Takes a `Permutation` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00326, a bijection (conjecturally rowmotion of the weak order, a semidistributive lattice).
