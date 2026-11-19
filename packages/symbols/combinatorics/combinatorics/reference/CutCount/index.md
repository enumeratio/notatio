---
name: CutCount
domain: Poset statistics
signature: CutCount(poset)
summary: "The Dedekind-MacNeille cuts: the subsets A equal to the elements below every upper bound of A, the empty subset included."
catalog:
  - system: findstat
    identity: St000656
    url: https://www.findstat.org/St000656
    on: Poset
statOn:
  - Poset
signatures:
  - call: CutCount(poset)
    description: "The Dedekind-MacNeille cuts: the subsets A equal to the elements below every upper bound of A, the empty subset included."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000656. The rows count these cuts of the order; a graph's cut is a bipartition, which this is not. The poset with no elements gives 1, the empty subset, a convention: FindStat has no row for it.
