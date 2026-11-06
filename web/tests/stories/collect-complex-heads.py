# Collects mpmath's values for the heads the complex WGSL emitter lowers, at the points
# complex-heads.golden.json holds, for gpu.spec.ts to hold the GPU kernels to.
#   python3 web/tests/stories/collect-complex-heads.py && vp fmt web/tests/stories/complex-heads.golden.json
# Needs mpmath (1.3.0 wrote the committed file). Each case is the head as canonical MathJSON in `z`,
# mpmath's value of it, and the relative error the f32 kernel was measured to stay within on the
# SwiftShader adapter (WGSL gives sin and cos only 2^-11, which is most of the 2e-4 floor).
import json
import os

import mpmath as mp

mp.mp.dps = 30

# 8 x 8 on [-4, 4]^2, shifted off the axes and the integers, then points hugging the branch cuts
# (each side of the negative real axis and of the imaginary axis), then the lattice below.
GRID = [(x + 0.0137, y - 0.0071) for y in (-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5) for x in (-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5)]
CUT = [(x, s * 1e-3) for x in (-3.3, -1.7, -0.6, 0.45, 1.9, 3.7) for s in (1, -1)] + [
    (s * 1e-3, y) for y in (-3.3, -1.7, -0.6, 0.45, 1.9, 3.7) for s in (1, -1)
]
# Exact multiples of ½ off the real axis: a portrait's pixels land on these when its pitch divides the
# view (460 pixels over a height of 10), and sin of a multiple of π is exactly 0 there.
LATTICE = [(k / 2, 2.815) for k in range(-12, 9)] + [(k / 2, -1.25) for k in (-7, -5, -3, -1, 1, 3)]
POINTS = GRID + CUT + LATTICE

# name: (MathJSON, mpmath expression in z, tolerance)
CASES = {
    "Ln": (["Ln", "z"], "mp.log(z)", 5e-7),
    "Sqrt": (["Sqrt", "z"], "mp.sqrt(z)", 5e-7),
    "Gamma": (["Gamma", "z"], "mp.gamma(z)", 3e-3),
    "Log": (["Log", "z"], "mp.log(z) / mp.log(10)", 5e-07),
    "Log (base 2)": (["Log", "z", 2], "mp.log(z) / mp.log(2)", 5e-07),
    "Tan": (["Tan", "z"], "mp.tan(z)", 0.0004),
    "Tanh": (["Tanh", "z"], "mp.tanh(z)", 0.0004),
    "Sinc": (["Sinc", "z"], "mp.sin(z) / z", 0.0005),
    "Re": (["Re", "z"], "mp.re(z)", 1e-06),
    "Im": (["Im", "z"], "mp.im(z)", 1e-06),
    "Arg": (["Arg", "z"], "mp.arg(z)", 1e-06),
    "LogGamma": (["LogGamma", "z"], "mp.loggamma(z)", 2e-05),
    "GammaLn": (["GammaLn", "z"], "mp.log(mp.gamma(z))", 2e-05),
    "Digamma": (["Digamma", "z"], "mp.digamma(z)", 0.0002),
    "Trigamma": (["Trigamma", "z"], "mp.psi(1, z)", 0.002),
    "PolyGamma 0": (["PolyGamma", 0, "z"], "mp.digamma(z)", 0.0002),
    "PolyGamma 1": (["PolyGamma", 1, "z"], "mp.psi(1, z)", 0.002),
    "Pochhammer": (["Pochhammer", 2.5, "z"], "mp.rf(2.5, z)", 0.0005),
    "Binomial": (["Binomial", 5, "z"], "mp.binomial(5, z)", 0.0005),
    "DirichletEta": (["DirichletEta", "z"], "(1 - 2 ** (1 - z)) * mp.zeta(z)", 0.008),
    "DirichletBeta": (["DirichletBeta", "z"], "4 ** (-z) * (mp.zeta(z, 0.25) - mp.zeta(z, 0.75))", 0.002),
    "Erf": (["Erf", "z"], "mp.erf(z)", 0.0005),
    "Erfc": (["Erfc", "z"], "mp.erfc(z)", 0.0005),
    "Erfi": (["Erfi", "z"], "mp.erfi(z)", 0.0005),
    "FresnelS": (["FresnelS", "z"], "mp.fresnels(z)", 0.0005),
    "FresnelC": (["FresnelC", "z"], "mp.fresnelc(z)", 0.0005),
    "SinIntegral": (["SinIntegral", "z"], "mp.si(z)", 0.0015),
    "CosIntegral": (["CosIntegral", "z"], "mp.ci(z)", 0.0003),
    "SinhIntegral": (["SinhIntegral", "z"], "mp.shi(z)", 0.0002),
    "CoshIntegral": (["CoshIntegral", "z"], "mp.chi(z)", 0.0004),
    "ExpIntegralEi": (["ExpIntegralEi", "z"], "mp.ei(z)", 0.0002),
    "LogIntegral": (["LogIntegral", "z"], "mp.li(z)", 0.0002),
    "AGM": (["AGM", "z"], "agm_right(1, z)", 5e-7),
    "AGM (a = 2.5)": (["AGM", 2.5, "z"], "agm_right(2.5, z)", 5e-7),
    "LambertW": (["LambertW", "z"], "mp.lambertw(z)", 0.0004),
    "EllipticK": (["EllipticK", "z"], "mp.ellipk(z)", 1e-06),
    "EllipticE": (["EllipticE", "z"], "mp.ellipe(z)", 1e-06),
    "EllipticF": (["EllipticF", 0.9, "z"], "mp.ellipf(0.9, z)", 0.0003),
    "Hypergeometric1F1": (["Hypergeometric1F1", 0.7, 1.9, "z"], "mp.hyp1f1(0.7, 1.9, z)", 0.0005),
    "BesselJ 0": (["BesselJ", 0, "z"], "mp.besselj(0, z)", 2e-06),
    "BesselJ 1": (["BesselJ", 1, "z"], "mp.besselj(1, z)", 0.0005),
    "BesselJ 1/2": (["BesselJ", 0.5, "z"], "mp.besselj(0.5, z)", 0.0005),
    "BesselI 2.3": (["BesselI", 2.3, "z"], "mp.besseli(2.3, z)", 0.0005),
    "BarnesG": (["BarnesG", "z"], "mp.barnesg(z)", 0.0006),
    "LogBarnesG (exp)": (["Exp", ["LogBarnesG", "z"]], "mp.barnesg(z)", 0.0006),
}


def agm_right(a, b, steps=80):
    """AGM(a, b) by the right choice of root (Cox): the root with Re(root * conj(next)) >= 0, a tie keeping the
    principal root (the limit from above the negative reals), as ce-patches' agm and Wolfram do; mpmath's own takes
    the principal root throughout and differs across the negative reals."""
    a, b = mp.mpc(a), mp.mpc(b)
    for _ in range(steps):
        nxt = (a + b) / 2
        root = mp.sqrt(a * b)
        if mp.re(root * mp.conj(nxt)) < 0:
            root = -root
        a, b = nxt, root
    return (a + b) / 2


def value(expr, z):
    v = mp.mpc(eval(expr, {"mp": mp, "z": z, "agm_right": agm_right}))
    return [float(v.real), float(v.imag)]


out = {
    "points": [list(p) for p in POINTS],
    "cases": {
        name: {"json": js, "tolerance": tol, "values": [value(expr, mp.mpc(*p)) for p in POINTS]}
        for name, (js, expr, tol) in CASES.items()
    },
}
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "complex-heads.golden.json")
with open(path, "w") as f:
    json.dump(out, f, separators=(",", ":"))
    f.write("\n")
