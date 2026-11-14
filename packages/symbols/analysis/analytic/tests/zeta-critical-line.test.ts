// unstable: a bare ComputeEngine with only the analytic declarations, to hold ζ to mpmath on its own
import { BigDecimal } from "@notatio/engine";
import { ComputeEngine } from "@notatio/engine/unstable";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/index.ts";

// ζ(1/2 + it) and ζ across the strip, checked against mpmath (zeta at 60 digits, s the exact value
// of the operands: a float operand is the double it is, not its shortest decimal). Near t = 10^5 a
// double's last place is 10^-11 and ζ moves by about 1 per unit of t, so a kernel that reads
// 100055.07295131683 as that decimal is off by 10^-11 before it computes anything.

/** [t, Re ζ, Im ζ] */
const CRITICAL_LINE: readonly [number, string, string][] = [
  [1055.0729513168335, "-0.04905837468955810139163209736157504846862", "0.06384147851698731124223270328857968284814"],
  [1035.4949653847143, "1.450168990347680876217171397203660504859", "-2.985931614350520495718070766609746950291"],
  [1099.5005621109158, "0.1873106900869967462335011659307988748872", "0.3264640494275888416649320414738114704521"],
  [1090.2323614107445, "1.113480002758183646859758618886595489456", "-0.1894560416037563487080924294306591552529"],
  [10055.072951316833, "-0.3380410710407802294198065013264909439542", "-0.9384150003322824943020712510719230264655"],
  [10035.494965384714, "0.5862239837969282047353122700129096780899", "1.429526255648283169901075513835115181221"],
];

/** The nightly's rows near 10^5: 0.7 s each here. */
const CRITICAL_LINE_DEEP: readonly [number, string, string][] = [
  [100055.07295131683, "-0.6511201312030375638798276452542641178953", "1.429039310097659147837741865219576019304"],
  [100035.49496538471, "3.966580513996043738160885845242513204614", "-3.192124106165573235910245921058518166314"],
  [100099.50056211092, "1.313212913822997145576672755469576322263", "1.083451121214010467611826714858576400053"],
  [100090.23236141074, "-0.01132713873292460290693741900754591675556", "-0.4772188969351376279093241382614726614475"],
];

/** [p, t, Re ζ, Im ζ] at s = p/10 + t·i */
const STRIP: readonly [number, number, string, string][] = [
  [5, 135, "-0.4749461807588827778499704404245069551392", "0.6325086004581155226217255299144419673448"],
  [9, 191, "1.760794010878355380427863257706761244272", "-1.165263882973866370194904830696207755079"],
  [7, 124, "0.4088946412161992975899281613793322537408", "0.2017811714457408815522536046776619143625"],
  [2, 193, "-0.7986482159503075777542742377899596611025", "-0.989423927258221737118733121125561912814"],
];

const deep = process.env["DEEP_TESTS"] === "1";

const machine = new ComputeEngine();
declareAnalytic(machine);
machine.precision = "machine";

const wide = new ComputeEngine();
declareAnalytic(wide);

/** Both parts of a machine answer are the double nearest the true part. */
const correctlyRounded = (value: { re: number; im: number; operator: string }, re: string, im: string): void => {
  expect(value.operator).toBe("Complex");
  expect([value.re, value.im]).toEqual([Number(re), Number(im)]);
};

/** `got` holds `want` to `digits` significant digits. */
const holds = (got: BigDecimal | undefined, want: string, digits: number): boolean => {
  if (got === undefined) return false;
  const exact = new BigDecimal(want);
  return got
    .sub(exact)
    .abs()
    .lte(exact.abs().mul(new BigDecimal(`1e-${digits - 1}`)));
};

test("evaluate and N give ζ(1/2 + it) correctly rounded at a float t", () => {
  for (const [t, re, im] of CRITICAL_LINE.filter(([t]) => t === 1055.0729513168335 || t === 10055.072951316833)) {
    const zeta = machine.box(["Zeta", ["Complex", 0.5, t]]);
    correctlyRounded(zeta.evaluate() as never, re, im);
    correctlyRounded(zeta.N() as never, re, im);
  }
});

test("N at the default precision keeps the double a float operand asks for, read exactly", () => {
  for (const [t, re, im] of CRITICAL_LINE.slice(0, 1)) {
    correctlyRounded(wide.box(["Zeta", ["Complex", 0.5, t]]).N() as never, re, im);
  }
});

test.skipIf(!deep)("ζ(1/2 + it) is correctly rounded for every float t the bench samples", () => {
  for (const [t, re, im] of [...CRITICAL_LINE, ...CRITICAL_LINE_DEEP]) {
    correctlyRounded(machine.box(["Zeta", ["Complex", 0.5, t]]).N() as never, re, im);
  }
});

test("a complex ζ at 30 digits keeps 30 digits in each part", () => {
  const engine = new ComputeEngine();
  declareAnalytic(engine);
  engine.precision = 30;
  for (const [p, t, re, im] of STRIP) {
    const value = engine.box(["Zeta", ["Add", ["Rational", p, 10], ["Complex", 0, t]]]).N();
    expect(value.operator, `${p}/10 + ${t}i`).toBe("Complex");
    expect(holds(value.bignumRe, re, 30), `Re at ${p}/10 + ${t}i`).toBe(true);
    expect(holds(value.bignumIm, im, 30), `Im at ${p}/10 + ${t}i`).toBe(true);
  }
});

test("past the sum the kernel can carry, ζ stays unevaluated rather than answer with lost digits", () => {
  const zeta = machine.box(["Zeta", ["Complex", 0.5, 10000055.072951317]]);
  expect(zeta.N().operator).toBe("Zeta");
  expect(zeta.evaluate().operator).toBe("Zeta");
});
