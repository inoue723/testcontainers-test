import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('User Integration Tests - Suite 1', () => {
  let prisma: PrismaClient;
  let setup: Awaited<ReturnType<typeof setupDatabase>>

  beforeAll(async () => {
    setup = await setupDatabase()
    prisma = new PrismaClient();
    await prisma.$connect();
  })

  afterAll(async () => {
    await setup.stopContainer()
  })

  it('should create a new user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test1@example.com',
        name: 'Test User 1',
      },
    })

    expect(user.id).toBeDefined()
    expect(user.email).toBe('test1@example.com')
    expect(user.name).toBe('Test User 1')
  })

  it('should find a user by email', async () => {
    await prisma.user.create({
      data: {
        email: 'test2@example.com',
        name: 'Test User 2',
      },
    })

    const user = await prisma.user.findUnique({
      where: { email: 'test2@example.com' },
    })

    expect(user).toBeDefined()
    expect(user?.name).toBe('Test User 2')
  })

  it('should update a user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test3@example.com',
        name: 'Test User 3',
      },
    })

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: 'Updated User 3' },
    })

    expect(updated.name).toBe('Updated User 3')
  })
})
