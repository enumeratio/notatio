# @notatio/hopf

Combinatorial Hopf algebra extensions for compute-engine: NSym and QSym on compositions,
with product, coproduct and antipode. Every other algebra in this section has a product
and nothing else; a Hopf algebra also has a coproduct, and the two must satisfy
$Δ(x \cdot y) = Δ(x) \cdot Δ(y)$ — the identity the whole package is tested
against. See [the guide](docs/hopf-algebras.md).

## Declaring

```ts
import { ComputeEngine } from "@cortex-js/compute-engine";
import { declareHopf } from "@notatio/hopf";

const ce = new ComputeEngine();
declareHopf(ce);
```

## The two algebras

Both are indexed by compositions (ordered lists of positive parts) and dual to each
other:

|          | basis | product       | coproduct                                  |
| -------- | ----- | ------------- | ------------------------------------------ |
| **NSym** | $H_α$ | concatenation | deconcatenation, extended multiplicatively |
| **QSym** | $M_α$ | quasi-shuffle | deconcatenation                            |

## Heads

- **NSym** — [`NSymAlgebra`](https://notatio.app/reference/symbol/NSymAlgebra),
  [`NSymH`](https://notatio.app/reference/symbol/NSymH) (complete basis),
  [`NSymR`](https://notatio.app/reference/symbol/NSymR) (ribbon basis)
- **QSym** — [`QSymAlgebra`](https://notatio.app/reference/symbol/QSymAlgebra),
  [`QSymM`](https://notatio.app/reference/symbol/QSymM) (monomial basis),
  [`QSymF`](https://notatio.app/reference/symbol/QSymF) (fundamental basis)
- **Structure** — [`Coproduct`](https://notatio.app/reference/symbol/Coproduct),
  [`Antipode`](https://notatio.app/reference/symbol/Antipode),
  [`Counit`](https://notatio.app/reference/symbol/Counit),
  [`HopfDegree`](https://notatio.app/reference/symbol/HopfDegree),
  [`HopfTensor`](https://notatio.app/reference/symbol/HopfTensor)
- **Basis conversion** — [`InCompleteBasis`](https://notatio.app/reference/symbol/InCompleteBasis),
  [`InRibbonBasis`](https://notatio.app/reference/symbol/InRibbonBasis),
  [`InMonomialBasis`](https://notatio.app/reference/symbol/InMonomialBasis),
  [`InFundamentalBasis`](https://notatio.app/reference/symbol/InFundamentalBasis),
  [`ConjugateComposition`](https://notatio.app/reference/symbol/ConjugateComposition)

`src/hopf.ts` also exports the underlying `Composition`/`Element`/`Tensor` model
(`nsymProduct`, `qsymCoproduct`, `quasiShuffle`, `antipode`, …) for use without going
through compute-engine.

## Next

Both bases at degree $n$ have dimension $2^{n-1}$, one basis element per composition of
$n$ — the guide checks the compatibility identity directly against that count.
