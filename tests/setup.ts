import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { execSync } from 'child_process'

export async function setupDatabase() {
  // PostgreSQLコンテナを起動
  const container = await new PostgreSqlContainer('postgres:16-alpine').start()
  console.log("Database container started", container.getConnectionUri(), container.getPort());

  const connectionString = container.getConnectionUri()

  // 環境変数を設定
  process.env.DATABASE_URL = connectionString

  // Prismaマイグレーションを実行
  execSync('npx prisma db push', {
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: 'inherit',
  })

  const stopContainer = async () => {
    await container.stop()
  }

  return { container, connectionString, stopContainer }
}
