import { defineConfig } from "vite-plus";
import { fmt, lint } from "@enumeratio/config";

// The theme is source, read by an app's VitePress build; this file is for `vp test` and `vp check`.
export default defineConfig({
  fmt,
  lint,
  test: { include: ["**/*.test.ts"] },
});
