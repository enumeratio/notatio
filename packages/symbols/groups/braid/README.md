# @notatio/braid

Braid groups for compute-engine: the Artin presentation, positive braids and their
closures, the Burau representation, Alexander polynomials, torus knots, and the Lorenz
braids of modular geodesics. A braid word is a finite string of generator indices — a
complete combinatorial name for the knot its closure ties. Start with
[knots and braids](docs/knots-and-braids.md) for the group and the closure construction, then
[torus knots](docs/torus-knots.md) for the simplest infinite family, and
[the Lorenz flow](docs/lorenz.md) for the strange-attractor connection.

## Declaring

```ts
import { ComputeEngine } from "@cortex-js/compute-engine";
import { declareBraid } from "@notatio/braid";

const ce = new ComputeEngine();
declareBraid(ce);
```

## Heads

- **The group** — [`Braid`](https://notatio.app/reference/symbol/Braid),
  [`BraidProduct`](https://notatio.app/reference/symbol/BraidProduct),
  [`BraidInverse`](https://notatio.app/reference/symbol/BraidInverse),
  [`BraidPower`](https://notatio.app/reference/symbol/BraidPower),
  [`BraidPermutation`](https://notatio.app/reference/symbol/BraidPermutation),
  [`BraidStrands`](https://notatio.app/reference/symbol/BraidStrands),
  [`BraidCrossings`](https://notatio.app/reference/symbol/BraidCrossings),
  [`BraidIsPositive`](https://notatio.app/reference/symbol/BraidIsPositive),
  [`BraidWrithe`](https://notatio.app/reference/symbol/BraidWrithe)
- **Closure and invariants** — [`BraidIsKnot`](https://notatio.app/reference/symbol/BraidIsKnot),
  [`BraidComponents`](https://notatio.app/reference/symbol/BraidComponents),
  [`BurauMatrix`](https://notatio.app/reference/symbol/BurauMatrix),
  [`AlexanderPolynomial`](https://notatio.app/reference/symbol/AlexanderPolynomial),
  [`SeifertGenus`](https://notatio.app/reference/symbol/SeifertGenus)
- **Jones/Kauffman** — [`KauffmanBracket`](https://notatio.app/reference/symbol/KauffmanBracket),
  [`BracketInvariant`](https://notatio.app/reference/symbol/BracketInvariant),
  [`JonesPolynomial`](https://notatio.app/reference/symbol/JonesPolynomial)
- **Named knots** — [`TorusKnot`](https://notatio.app/reference/symbol/TorusKnot),
  [`TorusBraid`](https://notatio.app/reference/symbol/TorusBraid),
  [`FigureEightKnot`](https://notatio.app/reference/symbol/FigureEightKnot),
  [`TwistKnot`](https://notatio.app/reference/symbol/TwistKnot),
  [`PretzelKnot`](https://notatio.app/reference/symbol/PretzelKnot)
- **Lorenz / modular geodesics** — [`LorenzBraid`](https://notatio.app/reference/symbol/LorenzBraid),
  [`LorenzPermutation`](https://notatio.app/reference/symbol/LorenzPermutation),
  [`PositivePermutationBraid`](https://notatio.app/reference/symbol/PositivePermutationBraid),
  [`TripNumber`](https://notatio.app/reference/symbol/TripNumber)
- **Curves** — [`KnotCurve`](https://notatio.app/reference/symbol/KnotCurve),
  [`LorenzCurve`](https://notatio.app/reference/symbol/LorenzCurve),
  [`ParametricCurve`](https://notatio.app/reference/symbol/ParametricCurve)

## Usage

```
JonesPolynomial(Braid(2, [1, 1, 1]))   // the right-handed trefoil's polynomial
AlexanderPolynomial(Braid(2, [1, 1, 1]))   // t^2 - t + 1 — same trefoil
AlexanderPolynomial("LLRLR")   // t^2 - t + 1 — the shortest knotted modular geodesic
TripNumber("LLRLR")   // 2 — its braid index
```

A modular geodesic word (`L`/`R`) and a braid closure can name the same knot; the Lorenz
guide is where that correspondence comes from — see also
[`@notatio/modular`](../modular/README.md), whose S/T words feed the Lorenz braid construction.

## Next

`src/laurent.ts` carries the Laurent-polynomial arithmetic the Alexander and Jones
computations run on; `src/curve.ts` is the parametric-curve sampling behind the
guides' 3D plots.
