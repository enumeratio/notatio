import { expect, test } from "vite-plus/test";
import { kernelUnavailable } from "../src/kernel-availability.ts";

test("a kernel that never answered is unavailable", () => {
  expect(kernelUnavailable({ stdout: "" })).toBe(true);
  expect(kernelUnavailable({ stdout: "  \n" })).toBe(true);
  expect(kernelUnavailable({ stdout: null })).toBe(true);
  expect(kernelUnavailable({ stdout: "", timedOut: true })).toBe(true);
  expect(kernelUnavailable({ stdout: "{True}", error: new Error("ETIMEDOUT") })).toBe(true);
  expect(kernelUnavailable({ stdout: "", stderr: "Connection closed by WolframKernel" })).toBe(true);
  expect(kernelUnavailable({ stdout: "Unable to start: kernel limit reached" })).toBe(true);
});

test("an answer, right or wrong, is the kernel talking", () => {
  expect(kernelUnavailable({ stdout: "{True, False}\n" })).toBe(false);
  expect(kernelUnavailable({ stdout: "{False}", stderr: "" })).toBe(false);
});
