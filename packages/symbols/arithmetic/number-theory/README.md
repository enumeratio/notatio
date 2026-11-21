# @notatio/number-theory

Number theory past $\mathbb{Z}/m$ for `@cortex-js/compute-engine`, over bigints: Gaussian
integers, rational reconstruction, Hermite normal form and integer valuations, plus a sweep
of Wolfram heads compute-engine doesn't have (divisor sums, Jacobi/Kronecker/Legendre
symbols, Stirling and Bell numbers, Frobenius, …). Builds on `@notatio/residues` (declare
that first) and `@notatio/numerals`. Every head answers exactly or stays unevaluated —
never approximate.

A handful of compute-engine's own heads (`Fibonacci`, `LucasL`, `Factorial`, `GCD`,
`NthPrime`, `PrimePi`) are re-declared here with faster exact algorithms — fast doubling,
binary splitting, Lehmer's algorithm, a segmented sieve — for the same results; see the
`declare-fast-*` modules.

## Usage

```ts
import { declareNumberTheory } from "@notatio/number-theory";

declareNumberTheory(ce); // declares @notatio/residues first if not already declared
```

`./src` exports the raw TypeScript entry for a workspace consumer. `gaussian` is a namespace
over the plain Gaussian-integer arithmetic the heads box and unbox; `hermiteDecomposition`,
`rationalReconstruction`, `fibonacci`/`fibonacciMod`/`lucasL`/`lucasLMod` are also exported
directly.

```
FactorInteger(360)                          // [[2, 3], [3, 2], [5, 1]]
HermiteDecomposition([[1, 2], [3, 4]])      // the unimodular u and Hermite form h with u·m = h
```

## Heads

**Primes and factoring**

- [`FactorInteger`](https://notatio.app/reference/symbol/FactorInteger) / [`Divisors`](https://notatio.app/reference/symbol/Divisors) — prime factorization and the divisor list
- [`IsPrime`](https://notatio.app/reference/symbol/IsPrime) / [`IsPrimePower`](https://notatio.app/reference/symbol/IsPrimePower) / [`IsSquareFree`](https://notatio.app/reference/symbol/IsSquareFree)
- [`NextPrime`](https://notatio.app/reference/symbol/NextPrime) / [`NthPrime`](https://notatio.app/reference/symbol/NthPrime) / [`PrimePi`](https://notatio.app/reference/symbol/PrimePi)

**Divisor and multiplicative functions**

- [`DivisorSigma`](https://notatio.app/reference/symbol/DivisorSigma) / [`DivisorSum`](https://notatio.app/reference/symbol/DivisorSum) / [`Totient`](https://notatio.app/reference/symbol/Totient) / [`CarmichaelLambda`](https://notatio.app/reference/symbol/CarmichaelLambda)
- [`MoebiusMu`](https://notatio.app/reference/symbol/MoebiusMu) / [`MangoldtLambda`](https://notatio.app/reference/symbol/MangoldtLambda) / [`LiouvilleLambda`](https://notatio.app/reference/symbol/LiouvilleLambda)
- [`PrimeNu`](https://notatio.app/reference/symbol/PrimeNu) / [`PrimeOmega`](https://notatio.app/reference/symbol/PrimeOmega) — distinct and with-multiplicity prime counts
- [`IsPerfect`](https://notatio.app/reference/symbol/IsPerfect) / [`PerfectNumber`](https://notatio.app/reference/symbol/PerfectNumber) / [`MersennePrimeExponent`](https://notatio.app/reference/symbol/MersennePrimeExponent)
- [`Abundance`](https://notatio.app/reference/symbol/Abundance) / [`AliquotSum`](https://notatio.app/reference/symbol/AliquotSum) — $\sigma(n)-2n$ and $\sigma(n)-n$
- [`SquareFreePart`](https://notatio.app/reference/symbol/SquareFreePart) / [`SquarePartRoot`](https://notatio.app/reference/symbol/SquarePartRoot) — $q$ and $s$ in $n=\pm s^2q$ with $q$ square-free

**GCD, modular and symbols**

- [`GCD`](https://notatio.app/reference/symbol/GCD) / [`LCM`](https://notatio.app/reference/symbol/LCM) / [`ExtendedGCD`](https://notatio.app/reference/symbol/ExtendedGCD) / [`IsCoprime`](https://notatio.app/reference/symbol/IsCoprime)
- [`ModularInverse`](https://notatio.app/reference/symbol/ModularInverse) / [`IntegerExponent`](https://notatio.app/reference/symbol/IntegerExponent) / [`Quotient`](https://notatio.app/reference/symbol/Quotient)
- [`JacobiSymbol`](https://notatio.app/reference/symbol/JacobiSymbol) / [`KroneckerSymbol`](https://notatio.app/reference/symbol/KroneckerSymbol) / [`LegendreSymbol`](https://notatio.app/reference/symbol/LegendreSymbol)

**Sequences and combinatorial number theory**

- [`Fibonacci`](https://notatio.app/reference/symbol/Fibonacci) / [`LucasL`](https://notatio.app/reference/symbol/LucasL) — fast doubling, and continuous on the profinite integers `@notatio/adeles` adds
- [`BellNumber`](https://notatio.app/reference/symbol/BellNumber) / [`CatalanNumber`](https://notatio.app/reference/symbol/CatalanNumber) / [`Stirling`](https://notatio.app/reference/symbol/Stirling) / [`StirlingS1`](https://notatio.app/reference/symbol/StirlingS1) / [`Multinomial`](https://notatio.app/reference/symbol/Multinomial) / [`Subfactorial`](https://notatio.app/reference/symbol/Subfactorial)
- [`PartitionsQ`](https://notatio.app/reference/symbol/PartitionsQ) / [`SquaresR`](https://notatio.app/reference/symbol/SquaresR) / [`PowersRepresentations`](https://notatio.app/reference/symbol/PowersRepresentations) / [`RamanujanTau`](https://notatio.app/reference/symbol/RamanujanTau)
- [`FrobeniusNumber`](https://notatio.app/reference/symbol/FrobeniusNumber) / [`FrobeniusSolve`](https://notatio.app/reference/symbol/FrobeniusSolve) — the largest non-representable value, and every representation, for a coin-problem instance
- [`EulerE`](https://notatio.app/reference/symbol/EulerE) at an integer index

**Past the integers**

- [`GaussianIntegers`](https://notatio.app/reference/symbol/GaussianIntegers) — $\mathbb{Z}[i]$; `PowerMod`, `PowerModList`, `GCD`, `LCM`, `IntegerExponent` and `Divisors` all reach into it when an operand is genuinely complex
- [`RationalReconstruction`](https://notatio.app/reference/symbol/RationalReconstruction) — the rational nearest a residue mod $m$
- [`HermiteDecomposition`](https://notatio.app/reference/symbol/HermiteDecomposition) — unimodular $u$ with $um$ in Hermite normal form; backs `@notatio/adeles`' strong approximation

## See also

Builds on `@notatio/residues` ([`residues`](../residues/README.md)) and `@notatio/numerals`
([`numerals`](../numerals/README.md)). `@notatio/adeles` ([`adeles`](../adeles/README.md)) depends on this
package for `HermiteDecomposition` and extends `Fibonacci`/`LucasL` to the profinite
integers.
