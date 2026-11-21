# @notatio/analytic

Analytic and special-function extensions for `@cortex-js/compute-engine` — everything past
the combinatorial collections: the Hurwitz-zeta family, Gamma-adjacent functions, elliptic
and modular functions, hypergeometric functions, integral transforms, and the symbolic
machinery (simplification, function-analysis predicates, ODE/difference-equation solving)
that reasons about them. Numeric kernels are the implementation; each head also carries a
reference definition in `definitions.ts` — the same function written as a plain expression
over compute-engine's own heads — that doubles as a differential oracle against the kernel.

## Usage

`declareAnalytic(ce)` declares everything in one pass. `./definitions` exports `DEFINITIONS`
and `PRIMITIVE` for reading a head's reference expression without declaring the package.

```text
HurwitzZeta(2, 1)
// Pi ^ 2 / 6 — reduces to the ordinary zeta at a = 1
```

## Heads

**Zeta and Dirichlet family** — [`Zeta`](https://notatio.app/reference/symbol/Zeta),
[`HurwitzZeta`](https://notatio.app/reference/symbol/HurwitzZeta),
[`LerchPhi`](https://notatio.app/reference/symbol/LerchPhi),
[`PolyLog`](https://notatio.app/reference/symbol/PolyLog),
[`DirichletL`](https://notatio.app/reference/symbol/DirichletL),
[`DirichletEta`](https://notatio.app/reference/symbol/DirichletEta),
[`DirichletBeta`](https://notatio.app/reference/symbol/DirichletBeta),
[`DirichletCharacter`](https://notatio.app/reference/symbol/DirichletCharacter),
[`StieltjesGamma`](https://notatio.app/reference/symbol/StieltjesGamma),
[`PrimeZetaP`](https://notatio.app/reference/symbol/PrimeZetaP),
[`MultiZetaValue`](https://notatio.app/reference/symbol/MultiZetaValue),
[`RiemannSiegelZ`](https://notatio.app/reference/symbol/RiemannSiegelZ),
[`RiemannSiegelTheta`](https://notatio.app/reference/symbol/RiemannSiegelTheta),
[`RiemannZetaZero`](https://notatio.app/reference/symbol/RiemannZetaZero),
[`KeiperLiLambda`](https://notatio.app/reference/symbol/KeiperLiLambda),
[`ClausenCl`](https://notatio.app/reference/symbol/ClausenCl).

**Gamma-adjacent** — [`Gamma`](https://notatio.app/reference/symbol/Gamma),
[`GammaLn`](https://notatio.app/reference/symbol/GammaLn),
[`GammaRegularized`](https://notatio.app/reference/symbol/GammaRegularized) /
[`InverseGammaRegularized`](https://notatio.app/reference/symbol/InverseGammaRegularized),
[`Beta`](https://notatio.app/reference/symbol/Beta) /
[`BetaRegularized`](https://notatio.app/reference/symbol/BetaRegularized) /
[`InverseBetaRegularized`](https://notatio.app/reference/symbol/InverseBetaRegularized),
[`Digamma`](https://notatio.app/reference/symbol/Digamma),
[`PolyGamma`](https://notatio.app/reference/symbol/PolyGamma),
[`BarnesG`](https://notatio.app/reference/symbol/BarnesG) /
[`LogBarnesG`](https://notatio.app/reference/symbol/LogBarnesG),
[`BernoulliB`](https://notatio.app/reference/symbol/BernoulliB),
[`HarmonicNumber`](https://notatio.app/reference/symbol/HarmonicNumber),
[`Pochhammer`](https://notatio.app/reference/symbol/Pochhammer) /
[`RisingFactorial`](https://notatio.app/reference/symbol/RisingFactorial),
[`Hyperfactorial`](https://notatio.app/reference/symbol/Hyperfactorial),
[`NorlundB`](https://notatio.app/reference/symbol/NorlundB),
[`BellY`](https://notatio.app/reference/symbol/BellY).

**Elliptic and modular** — the Jacobi elliptic functions
([`JacobiSN`](https://notatio.app/reference/symbol/JacobiSN), …),
[`EllipticTheta`](https://notatio.app/reference/symbol/EllipticTheta),
[`IncompleteEllipticPi`](https://notatio.app/reference/symbol/IncompleteEllipticPi),
[`ModularJ`](https://notatio.app/reference/symbol/ModularJ) /
[`KleinInvariantJ`](https://notatio.app/reference/symbol/KleinInvariantJ),
[`EisensteinG`](https://notatio.app/reference/symbol/EisensteinG), the Carlson
symmetric forms
([`CarlsonRF`](https://notatio.app/reference/symbol/CarlsonRF),
`RC`, `RD`, `RG`, `RJ`).

**Hypergeometric** — [`HypergeometricPFQ`](https://notatio.app/reference/symbol/HypergeometricPFQ),
[`HypergeometricU`](https://notatio.app/reference/symbol/HypergeometricU),
[`Hypergeometric0F1`](https://notatio.app/reference/symbol/Hypergeometric0F1) and the
regularized `1F1`/`2F1`/`3F2` forms,
[`MeijerG`](https://notatio.app/reference/symbol/MeijerG),
[`LambertW`](https://notatio.app/reference/symbol/LambertW),
[`ChebyshevT`](https://notatio.app/reference/symbol/ChebyshevT) /
[`ChebyshevU`](https://notatio.app/reference/symbol/ChebyshevU),
[`HermiteH`](https://notatio.app/reference/symbol/HermiteH),
[`LaguerreL`](https://notatio.app/reference/symbol/LaguerreL),
[`LegendrePolynomial`](https://notatio.app/reference/symbol/LegendrePolynomial),
[`ExpIntegralE`](https://notatio.app/reference/symbol/ExpIntegralE),
[`BesselJZero`](https://notatio.app/reference/symbol/BesselJZero).

**Transforms and signals** — [`FourierTransform`](https://notatio.app/reference/symbol/FourierTransform) /
[`InverseFourierTransform`](https://notatio.app/reference/symbol/InverseFourierTransform),
[`LaplaceTransform`](https://notatio.app/reference/symbol/LaplaceTransform) /
[`InverseLaplaceTransform`](https://notatio.app/reference/symbol/InverseLaplaceTransform),
[`MellinTransform`](https://notatio.app/reference/symbol/MellinTransform) /
[`InverseMellinTransform`](https://notatio.app/reference/symbol/InverseMellinTransform),
[`HankelTransform`](https://notatio.app/reference/symbol/HankelTransform),
[`FourierSeries`](https://notatio.app/reference/symbol/FourierSeries),
[`UnitStep`](https://notatio.app/reference/symbol/UnitStep),
[`DiscreteDelta`](https://notatio.app/reference/symbol/DiscreteDelta) /
[`DiracDelta`](https://notatio.app/reference/symbol/DiracDelta),
[`SquareWave`](https://notatio.app/reference/symbol/SquareWave) /
[`SawtoothWave`](https://notatio.app/reference/symbol/SawtoothWave) /
[`TriangleWave`](https://notatio.app/reference/symbol/TriangleWave).

**Symbolic and solving** — [`FullSimplify`](https://notatio.app/reference/symbol/FullSimplify),
[`FunctionExpand`](https://notatio.app/reference/symbol/FunctionExpand),
[`PowerExpand`](https://notatio.app/reference/symbol/PowerExpand),
[`TrigFactor`](https://notatio.app/reference/symbol/TrigFactor),
[`Refine`](https://notatio.app/reference/symbol/Refine) under
[`Assuming`](https://notatio.app/reference/symbol/Assuming),
[`Inequality`](https://notatio.app/reference/symbol/Inequality),
[`FindInstance`](https://notatio.app/reference/symbol/FindInstance),
[`DSolveValue`](https://notatio.app/reference/symbol/DSolveValue),
[`DifferenceRoot`](https://notatio.app/reference/symbol/DifferenceRoot) /
[`DifferentialRoot`](https://notatio.app/reference/symbol/DifferentialRoot),
[`SeriesCoefficient`](https://notatio.app/reference/symbol/SeriesCoefficient),
[`NSum`](https://notatio.app/reference/symbol/NSum),
[`Minimize`](https://notatio.app/reference/symbol/Minimize) /
[`Maximize`](https://notatio.app/reference/symbol/Maximize), and the
[`FunctionDomain`](https://notatio.app/reference/symbol/FunctionDomain) family of
function-analysis predicates (`FunctionContinuous`, `FunctionMonotonicity`,
`FunctionSingularities`, …).

The patches these heads land through (`lerch-phi`, `dirichlet`, `barnes-g`, `log-gamma`,
`clausen`, `stieltjes`) live in
[`@notatio/ce-patches`](../../../ce-patches) — see its README for
the upstreaming model. (`round-places`, `zeta-hurwitz`, `polylog-order` and
`polygamma-complex` landed in compute-engine 0.141 and were retired.)

## Explore

- [`/explore/zeta`](https://notatio.app/explore/zeta/) — `Zeta`/`HurwitzZeta`
- [`/explore/lerchphi`](https://notatio.app/explore/lerchphi/) — `LerchPhi`
- [`/explore/polylog`](https://notatio.app/explore/polylog/) — `PolyLog`
