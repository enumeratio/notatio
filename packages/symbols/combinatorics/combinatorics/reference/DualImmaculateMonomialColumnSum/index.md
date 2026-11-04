---
name: DualImmaculateMonomialColumnSum
domain: Composition statistics
signature: DualImmaculateMonomialColumnSum(composition)
summary: The sum of the entries in the column of the composition in the matrix from the dual immaculate to the monomial quasisymmetric functions.
catalog:
  - system: findstat
    identity: St000817
    url: https://www.findstat.org/St000817
    on: IntegerComposition
statOn:
  - IntegerComposition
signatures:
  - call: DualImmaculateMonomialColumnSum(composition)
    description: The sum of the entries in the column of the composition in the matrix from the dual immaculate to the monomial quasisymmetric functions.
    library: enumeratio-combinatorics
    type: (composition) -> number
---

- Defined over `IntegerComposition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerComposition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000817: the number of immaculate tableaux of the shape with any gapless content (Berg, Bergeron, Saliola, Serrano and Zabrocki).
