---
name: NumberFieldDiscriminant
domain: Number theory
signature: NumberFieldDiscriminant(a)
primitive: kernel
summary: 'The discriminant of the number field $\mathbb{Q}(a)$: of its ring of integers $\mathcal{O}_K$.'
signatures:
  - call: NumberFieldDiscriminant(a)
    description: "the discriminant of $\\mathcal{O}_K$ for $K = \\mathbb{Q}(a)$; it divides the minimal polynomial's discriminant by the square of $[\\mathcal{O}_K : \\mathbb{Z}[a]]$"
    library: enumeratio-number-theory
    type: (number) -> integer
bindings:
  - origin: native
    form: typescript
    environment: engine
    source: packages/ce-patches/src/compute-engine/library/algebraic-numbers.ts
  - origin: mapped
    form: wolfram
    template: NumberFieldDiscriminant[$1]
    arity: 1
seeAlso:
  - NumberFieldIntegralBasis
  - NumberFieldSignature
  - AlgebraicIntegers
names:
  wolframIdentity: true
---

- $\mathcal{O}_K$ is found by enlarging $\mathbb{Z}[a]$ at each prime $p$ with $p^2$ dividing its discriminant: not at all where the polynomial is Eisenstein at $p$, else by rounds of Pohst–Zassenhaus until the order is $p$-maximal; it declines (stays unevaluated) when the discriminant can't be factored, the field is past degree 12, or a time limit of the engine passes
- The field is $\mathbb{Q}(a)$: for $a$ in a proper subfield of the field it is read in, the subfield's, from $a$'s minimal polynomial
