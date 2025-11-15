import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

let container: StartedPostgreSqlContainer
let prisma: PrismaClient

export async function setupDatabase() {
  // PostgreSQLコンテナを起動
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withExposedPorts(5432)
    .start()

  const connectionString = container.getConnectionUri()

  // 環境変数を設定
  process.env.DATABASE_URL = connectionString

  // Prismaマイグレーションを実行
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: 'inherit',
  })

  // PrismaClientを初期化
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  })

  await prisma.$connect()

  return { container, prisma, connectionString }
}

export async function teardownDatabase(prisma: PrismaClient, container: StartedPostgreSqlContainer) {
  await prisma.$disconnect()
  await container.stop()
}
