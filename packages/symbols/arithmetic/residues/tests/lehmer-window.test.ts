// Lehmer's GCD around its 64-bit machine-word cutoff and the engine's 128-bit threshold:
// exact against plain Euclid at balanced and lopsided widths, with and without a common
// factor, signs and zero included. The long sweep runs under DEEP_TESTS=1.
import { expect, test } from "vite-plus/test";
import { lehmerGcd } from "../src/arith.ts";

const deep = process.env["DEEP_TESTS"] === "1";

function euclidGcd(a: bigint, b: bigint): bigint {
  let [x, y] = [a < 0n ? -a : a, b < 0n ? -b : b];
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

function seededBits(seed: number): (bits: number) => bigint {
  let s = seed;
  const next = () => (s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff;
  return (bits) => {
    if (bits <= 0) return 0n;
    let n = 1n;
    for (let i = 1; i < bits; i++) n = (n << 1n) | (next() < 0.5 ? 0n : 1n);
    return n;
  };
}

test("lehmerGcd agrees with plain Euclid around the 64- and 128-bit thresholds, with and without a common factor", () => {
  const randomBits = seededBits(1340);
  const widths = deep
    ? [62, 63, 64, 65, 66, 100, 127, 128, 129, 130, 192, 256, 300, 1024]
    : [63, 64, 65, 127, 128, 129, 300];
  const trials = deep ? 60 : 3;
  for (const wa of widths) {
    for (const wb of widths) {
      for (let t = 0; t < trials; t++) {
        const shared = t % 2 === 0 ? 1n : randomBits(Math.max(1, Math.min(wa, wb) >> 1));
        let a = shared * randomBits(wa);
        let b = shared * randomBits(wb);
        if (t & 1) a = -a;
        if (t & 2) b = -b;
        expect(lehmerGcd(a, b)).toBe(euclidGcd(a, b));
      }
    }
  }
});

test("lehmerGcd handles zero, equal, multiple, power-of-two and Fibonacci operands past the window", () => {
  const big = 2n ** 300n + 12345n;
  expect(lehmerGcd(0n, big)).toBe(big);
  expect(lehmerGcd(-big, 0n)).toBe(big);
  expect(lehmerGcd(big, big)).toBe(big);
  expect(lehmerGcd(big * 1000003n, big)).toBe(big);
  expect(lehmerGcd(2n ** 400n, 2n ** 350n)).toBe(2n ** 350n);
  expect(lehmerGcd(2n ** 400n - 1n, 2n ** 350n - 1n)).toBe(2n ** 50n - 1n);
  // Consecutive Fibonacci numbers are Euclid's slowest input: every quotient is 1.
  let [f0, f1] = [0n, 1n];
  for (let i = 0; i < 1500; i++) [f0, f1] = [f1, f0 + f1];
  expect(lehmerGcd(f1, f0)).toBe(1n);
});

test.runIf(deep)("lehmerGcd agrees with plain Euclid on a long random sweep up to 20000 bits", () => {
  const randomBits = seededBits(1341);
  for (let t = 0; t < 400; t++) {
    const wa = 1 + Number(randomBits(14) % 20000n);
    const wb = 1 + Number(randomBits(14) % 20000n);
    const shared = t % 3 === 0 ? randomBits(Math.floor(Math.min(wa, wb) / 2)) : 1n;
    const a = (t & 1 ? -1n : 1n) * shared * randomBits(wa);
    const b = shared * randomBits(wb);
    expect(lehmerGcd(a, b)).toBe(euclidGcd(a, b));
  }
});
