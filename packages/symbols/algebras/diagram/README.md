# @notatio/diagram

Diagram-algebra extensions for compute-engine: the partition algebra and its subalgebras
(Brauer, Temperley–Lieb, Motzkin, rook, symmetric group), whose bases are combinatorial
diagrams — set partitions of a top and bottom row, multiplied by stacking and gluing. The
construction, the lattice of subalgebras and the dimension formulas are in
[the guide](docs/diagram-algebras.md).

## Declaring

```ts
import { ComputeEngine } from "@cortex-js/compute-engine";
import { declareDiagrams } from "@notatio/diagram";

const ce = new ComputeEngine();
declareDiagrams(ce);
```

## Heads

- **Algebras** — [`PartitionAlgebra`](https://notatio.app/reference/symbol/PartitionAlgebra),
  [`BrauerAlgebra`](https://notatio.app/reference/symbol/BrauerAlgebra),
  [`TemperleyLiebAlgebra`](https://notatio.app/reference/symbol/TemperleyLiebAlgebra),
  [`MotzkinAlgebra`](https://notatio.app/reference/symbol/MotzkinAlgebra)
- **Diagrams** — [`Diagram`](https://notatio.app/reference/symbol/Diagram),
  [`OrbitDiagram`](https://notatio.app/reference/symbol/OrbitDiagram),
  [`DiagramCoarsenings`](https://notatio.app/reference/symbol/DiagramCoarsenings)
- **Bases** — [`InDiagramBasis`](https://notatio.app/reference/symbol/InDiagramBasis),
  [`InOrbitBasis`](https://notatio.app/reference/symbol/InOrbitBasis)

`src/dimensions.ts` also exports the closed-form counts behind
[`AlgebraDimension`](https://notatio.app/reference/symbol/AlgebraDimension) — `bell`, `catalan`,
`motzkin`, `rookCount` — and `src/orbit.ts` the coarsening machinery for `InOrbitBasis`.

## Usage

```
AlgebraDimension(PartitionAlgebra(3))          // 203 — B(6), the Bell number
AlgebraDimension(PlanarPartitionAlgebra(3))    // 132 — planarity cuts 203 down to C(6)
Element(Diagram([[1, 2, -1], [3, -3], [-2]]), PartitionAlgebra(3))   // True
```

## Next

The guide covers which subalgebra corresponds to which restriction on admitted diagrams
(planar, non-crossing, fixed-point-free, …) and how a closed loop contributes the loop
parameter $δ$ on multiplication.
