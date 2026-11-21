# @notatio/groupalgebra

Group-algebra extensions for compute-engine: cyclic, dihedral and product groups, their
group algebras, conjugacy classes and centres. The group algebra $k[G]$ is the most
elementary construction in this section of the catalogue — its basis is just the group's
elements — and the point of the package is the **centre**: a canonical commutative
subalgebra spanned by class sums, one per conjugacy class. See
[the guide](docs/group-algebras.md).

## Declaring

```ts
import { ComputeEngine } from "@cortex-js/compute-engine";
import { declareGroupAlgebra } from "@notatio/groupalgebra";

const ce = new ComputeEngine();
declareGroupAlgebra(ce);
```

## Heads

- **Groups** — [`CyclicGroup`](https://notatio.app/reference/symbol/CyclicGroup),
  [`DihedralGroup`](https://notatio.app/reference/symbol/DihedralGroup),
  [`PermutationGroup`](https://notatio.app/reference/symbol/PermutationGroup),
  [`AlternatingGroup`](https://notatio.app/reference/symbol/AlternatingGroup),
  [`GroupOrder`](https://notatio.app/reference/symbol/GroupOrder),
  [`GroupGenerators`](https://notatio.app/reference/symbol/GroupGenerators),
  [`GroupElements`](https://notatio.app/reference/symbol/GroupElements)
- **The algebra** — [`GroupBasis`](https://notatio.app/reference/symbol/GroupBasis),
  [`ClassSum`](https://notatio.app/reference/symbol/ClassSum),
  [`ConjugacyClasses`](https://notatio.app/reference/symbol/ConjugacyClasses)
- **Permutations** — [`Cycles`](https://notatio.app/reference/symbol/Cycles),
  [`PermutationCycles`](https://notatio.app/reference/symbol/PermutationCycles),
  [`PermutationList`](https://notatio.app/reference/symbol/PermutationList),
  [`PermutationReplace`](https://notatio.app/reference/symbol/PermutationReplace),
  [`Permute`](https://notatio.app/reference/symbol/Permute),
  [`InversePermutation`](https://notatio.app/reference/symbol/InversePermutation)

`src/group.ts` also exports the underlying group model (`directProduct`, `isAbelian`,
`isCentral`, `conjugacyClasses`) used directly by [`@notatio/hecke`](../hecke/README.md) and
[`@notatio/diagram`](../diagram/README.md) for their own symmetric-group bookkeeping.

## Usage

```
GroupIsAbelian(CyclicGroup(6))         // True
GroupIsAbelian(DihedralGroup(4))       // False
IsCentral(DihedralGroup(3), ClassSum(DihedralGroup(3), 2))   // True
```

## Next

The guide walks through why every group's centre is commutative even when the group
itself is not, and how the class-sum basis connects to irreducible characters.
