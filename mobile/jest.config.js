module.exports = {
  testEnvironment: "node",
  testMatch: ["**/Tests/**/*.test.ts"],
  setupFiles: ["./Tests/unit/setup.ts"],
  testTimeout: 10000,
  forceExit: true,
  maxWorkers: 1,
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "./tsconfig.test.json" }],
  },
};
