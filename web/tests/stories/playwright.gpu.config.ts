// Playwright config for the WebGPU specs (gpu.spec.ts), kept apart from the headless one:
// headless Chromium destroys any device whose canvas is configured, so these run headed.
// There is no display on a build box; run under a virtual one, with SwiftShader as the adapter:
//
//   cd web && xvfb-run -a node node_modules/@playwright/test/cli.js test -c tests/stories/playwright.gpu.config.ts
//
// On two CPUs the 68 tests take about 8 minutes; the nightly job shards them (`--shard=n/3`).
//
// `xvfb-run -a` picks its own free display; never point this at a real one.

import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.STORIES_PORT ?? 5614);

export default defineConfig({
  testDir: ".",
  testMatch: "gpu.spec.ts",
  timeout: 180_000,
  expect: { timeout: 120_000 },
  // Test-level, so the nightly job can `--shard` the one spec file across runners.
  fullyParallel: true,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    navigationTimeout: 120_000,
    headless: false,
    launchOptions: {
      args: [
        "--enable-unsafe-webgpu",
        "--use-webgpu-adapter=swiftshader",
        "--enable-features=Vulkan",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec vitepress dev --port ${PORT}`,
    cwd: "../..",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
