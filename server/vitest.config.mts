import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],

    // Vsichki testove pipat EDNA baza, zatova gi puskame strogo
    // edin sled drug — inache si iztrivat dannite vzaimno
    // ("test pollution").
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    sequence: { concurrent: false },

    testTimeout: 20000, // Atlas e v oblaka, zayavkite otnemat vreme
  },
});
