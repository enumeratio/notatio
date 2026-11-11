---
name: NumberFieldIntegralBasis
domain: Number theory
signature: NumberFieldIntegralBasis(a)
primitive: kernel
summary: A $\mathbb{Z}$-basis of the ring of integers of $\mathbb{Q}(a)$, written on the powers of the generator $a$ is read in (the radical or root it is written in), as Wolfram writes it.
signatures:
  - call: NumberFieldIntegralBasis(a)
    description: 'a basis of $\mathcal{O}_K$: the $i$-th element $a^i/d_i$ plus lower powers, each lower coefficient reduced'
    library: enumeratio-number-theory
    type: (number) -> list
bindings:
  - origin: native
    form: typescript
    environment: engine
    source: packages/ce-patches/src/compute-engine/library/algebraic-numbers.ts
  - origin: mapped
    form: wolfram
    template: NumberFieldIntegralBasis[$1]
    arity: 1
seeAlso:
  - NumberFieldDiscriminant
  - AlgebraicIntegers
names:
  wolframIdentity: true
---

- The basis is triangular on $1, g, \ldots, g^{n-1}$ for $g$ the generator $a$ is read in ($a$ itself when it is one radical or one [[PolynomialRoot]]), as Wolfram's is; any other basis differs by a matrix in $\mathrm{GL}_n(\mathbb{Z})$
- When $a$ generates a proper subfield of the field it is read in ($\sqrt[4]{2}^2$ in $\mathbb{Q}(\sqrt[4]{2})$), the field is $\mathbb{Q}(a)$ and the basis is triangular on $a$'s powers, written in $g$
- A rational generates $\mathbb{Q}$: the basis is $\{1\}$
