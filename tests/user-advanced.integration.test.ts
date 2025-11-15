import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { setupDatabase, teardownDatabase } from './setup'

describe('User Advanced Integration Tests - Suite 4', () => {
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

  it('should list all users', async () => {
    await prisma.user.createMany({
      data: [
        { email: 'adv1@example.com', name: 'Adv User 1' },
        { email: 'adv2@example.com', name: 'Adv User 2' },
        { email: 'adv3@example.com', name: 'Adv User 3' },
      ],
    })

    const users = await prisma.user.findMany()
    expect(users.length).toBeGreaterThanOrEqual(3)
  })

  it('should paginate users', async () => {
    await prisma.user.createMany({
      data: [
        { email: 'page1@example.com', name: 'Page User 1' },
        { email: 'page2@example.com', name: 'Page User 2' },
        { email: 'page3@example.com', name: 'Page User 3' },
      ],
    })

    const page1 = await prisma.user.findMany({
      take: 2,
      skip: 0,
      orderBy: { id: 'asc' },
    })

    expect(page1.length).toBeLessThanOrEqual(2)
  })

  it('should search users by name pattern', async () => {
    await prisma.user.create({
      data: { email: 'search1@example.com', name: 'Searchable User' },
    })

    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: 'Searchable',
        },
      },
    })

    expect(users.length).toBeGreaterThan(0)
    expect(users[0].name).toContain('Searchable')
  })
})
