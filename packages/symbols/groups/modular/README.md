# @notatio/modular

The modular group $\mathrm{PSL}(2,\mathbb{Z})$ for compute-engine: S/T and L/R words,
continued fractions, the Stern–Brocot tree, hyperbolic conjugacy classes as necklaces, and
the Rademacher symbol. The group is a free product $\mathbb{Z}/2 * \mathbb{Z}/3$, so every
element is a word and questions about the group become questions about words — the same
combinatorics this catalogue already counts elsewhere. See [the guide](docs/modular-group.md)
for the construction and the payoff: a conjugacy class as a knotted orbit, linked to the
trefoil by a number you read off the word.

## Declaring

```ts
import { ComputeEngine } from "@cortex-js/compute-engine";
import { declareModular } from "@notatio/modular";

const ce = new ComputeEngine();
declareModular(ce);
```

## Heads

- **The group** — [`ModularMatrix`](https://notatio.app/reference/symbol/ModularMatrix),
  [`ModularSTWord`](https://notatio.app/reference/symbol/ModularSTWord),
  [`ModularWord`](https://notatio.app/reference/symbol/ModularWord),
  [`ModularFromSTWord`](https://notatio.app/reference/symbol/ModularFromSTWord),
  [`ModularTrace`](https://notatio.app/reference/symbol/ModularTrace),
  [`ModularKind`](https://notatio.app/reference/symbol/ModularKind)
- **Continued fractions** — [`ContinuedFraction`](https://notatio.app/reference/symbol/ContinuedFraction),
  [`ContinuedFractionK`](https://notatio.app/reference/symbol/ContinuedFractionK),
  [`Convergents`](https://notatio.app/reference/symbol/Convergents),
  [`SternBrocotPath`](https://notatio.app/reference/symbol/SternBrocotPath),
  [`FromSternBrocotPath`](https://notatio.app/reference/symbol/FromSternBrocotPath),
  [`FareyNeighbours`](https://notatio.app/reference/symbol/FareyNeighbours),
  [`PellSolution`](https://notatio.app/reference/symbol/PellSolution)
- **Quadratic forms** — [`QuadraticForm`](https://notatio.app/reference/symbol/QuadraticForm),
  [`FormDiscriminant`](https://notatio.app/reference/symbol/FormDiscriminant),
  [`FormAction`](https://notatio.app/reference/symbol/FormAction),
  [`ReduceForm`](https://notatio.app/reference/symbol/ReduceForm),
  [`IsReducedForm`](https://notatio.app/reference/symbol/IsReducedForm),
  [`FormCycle`](https://notatio.app/reference/symbol/FormCycle),
  [`ReducedForms`](https://notatio.app/reference/symbol/ReducedForms),
  [`FormClasses`](https://notatio.app/reference/symbol/FormClasses),
  [`FormClassNumber`](https://notatio.app/reference/symbol/FormClassNumber),
  [`IsPrimitiveClass`](https://notatio.app/reference/symbol/IsPrimitiveClass),
  [`IsIndefinite`](https://notatio.app/reference/symbol/IsIndefinite),
  [`IsQuadraticIrrational`](https://notatio.app/reference/symbol/IsQuadraticIrrational),
  [`FormAutomorph`](https://notatio.app/reference/symbol/FormAutomorph),
  [`FormRho`](https://notatio.app/reference/symbol/FormRho)
- **Conjugacy and Rademacher** — [`ModularClass`](https://notatio.app/reference/symbol/ModularClass),
  [`ModularClasses`](https://notatio.app/reference/symbol/ModularClasses),
  [`RademacherSymbol`](https://notatio.app/reference/symbol/RademacherSymbol),
  [`RademacherPhi`](https://notatio.app/reference/symbol/RademacherPhi),
  [`DedekindSum`](https://notatio.app/reference/symbol/DedekindSum),
  [`LinkingWithTrefoil`](https://notatio.app/reference/symbol/LinkingWithTrefoil)
- **Number theory** — [`KroneckerSymbol`](https://notatio.app/reference/symbol/KroneckerSymbol)

## Usage

```
ContinuedFraction(355/113)          // [3, 7, 16] — pi's famous convergent
SternBrocotPath(5, 3)               // "RLR"
RademacherSymbol("LRRRR")           // 3 — four rights, one left
DedekindSum(4, 3)                   // 1/18
RademacherPhi(ModularMatrix(1, 7, 0, 1))   // 7 — Phi on T^n just counts
```

## Next

[`@notatio/braid`](../braid/README.md) builds its [Lorenz braids](../braid/docs/lorenz.md)
directly on the S/T words here; the guide's linking-number payoff is the bridge between
the two packages.
