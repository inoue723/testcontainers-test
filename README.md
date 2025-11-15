# Testcontainers + Vitest + Prisma Integration Tests

このプロジェクトは、testcontainers、vitest、prismaを使用した5並列の結合テスト環境のサンプルです。

## 特徴

- **Testcontainers**: PostgreSQLコンテナを使用した隔離されたテスト環境
- **Vitest**: 高速なテストランナーで並列実行をサポート
- **Prisma**: 型安全なORMでデータベース操作
- **5並列実行**: GitHub Actionsで5つのシャードに分割して並列実行

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# Prisma Clientの生成
pnpm db:generate
```

## テストの実行

```bash
# すべての結合テストを実行
pnpm test:integration

# ウォッチモード
pnpm test:watch

# 5並列でシャード実行（CI環境）
pnpm test:integration --shard=1/5
pnpm test:integration --shard=2/5
pnpm test:integration --shard=3/5
pnpm test:integration --shard=4/5
pnpm test:integration --shard=5/5
```

## プロジェクト構造

```
.
├── .github/
│   └── workflows/
│       └── integration-tests.yml  # 5並列CI設定
├── prisma/
│   ├── schema.prisma              # データベーススキーマ
│   └── migrations/                # マイグレーションファイル
├── tests/
│   ├── setup.ts                   # テストコンテナのセットアップ
│   ├── user.integration.test.ts
│   ├── post.integration.test.ts
│   ├── user-post-relation.integration.test.ts
│   ├── user-advanced.integration.test.ts
│   └── post-advanced.integration.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.integration.ts   # Vitest設定（並列実行）
```

## GitHub Actions

`.github/workflows/integration-tests.yml`で5並列のテスト実行が設定されています。

各シャードは独立して実行され、失敗したシャードがあっても他のシャードは継続して実行されます。

## テストの追加

新しい結合テストを追加する場合:

1. `tests/`ディレクトリに`*.integration.test.ts`ファイルを作成
2. `setupDatabase()`と`teardownDatabase()`を使用してテストコンテナを管理
3. Prisma Clientでデータベース操作を実行

例:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { setupDatabase, teardownDatabase } from './setup'

describe('My Integration Tests', () => {
  let prisma: PrismaClient
  let container: StartedPostgreSqlContainer

  beforeAll(async () => {
    const setup = await setupDatabase()
    prisma = setup.prisma
    container = setup.container
  })

  afterAll(async () => {
    await teardownDatabase(prisma, container)
  })

  it('should do something', async () => {
    // テストコード
  })
})
```

## 注意事項

- Dockerが必要です（Testcontainersがコンテナを起動するため）
- CI環境ではDockerサービスが利用可能である必要があります
- 各テストファイルは独立したPostgreSQLコンテナを使用します
