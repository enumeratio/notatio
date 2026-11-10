---
name: WeylGroupConnectedElementCount
domain: Cartan type statistics
signature: WeylGroupConnectedElementCount(cartanType)
summary: "The elements of the Coxeter group whose reduced words use every simple reflection, by inclusion and exclusion over the standard parabolic subgroups: the indecomposable permutations for A_n."
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- For B_n the elements whose support misses the last node are 2^k k! C(n - k) with C the indecomposable permutations; D_n splits by the component through the node n - 2. The exceptional types are the alternating sums of the orders of their standard parabolic subgroups.
