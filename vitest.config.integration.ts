import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.integration.test.ts'],
    globals: true,
    testTimeout: 60000,
    hookTimeout: 60000,
    // 並列実行の設定
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    // ファイルごとに並列実行
    fileParallelism: true,
    // 各テストファイルを独立したプロセスで実行
    isolate: true,
    // テストの最大並列数（CI環境で5に制限）
    maxConcurrency: process.env.CI ? 5 : 5,
    minWorkers: process.env.CI ? 5 : 1,
    maxWorkers: process.env.CI ? 5 : 5,
  },
})
