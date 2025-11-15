import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Conflict Email Duplicate Tests - Suite 13', () => {
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

  it('should attempt to create user with common@example.com', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'common@example.com',
        name: 'Common User B',
      },
    })

    expect(user.email).toBe('common@example.com')
  })

  it('should handle duplicate email creation attempt', async () => {
    await prisma.user.create({
      data: {
        email: 'unique1@example.com',
        name: 'User 1',
      },
    })

    await expect(
      prisma.user.create({
        data: {
          email: 'unique1@example.com',
          name: 'User 2',
        },
      })
    ).rejects.toThrow()
  })

  it('should create user with admin@example.com again', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Another Admin',
      },
    })

    expect(user.email).toBe('admin@example.com')
  })

  it('should update to potentially conflicting email', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'update-source@example.com',
        name: 'Update Source',
      },
    })

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { email: 'test@example.com' },
    })

    expect(updated.email).toBe('test@example.com')
  })

  it('should search for users by email pattern', async () => {
    await prisma.user.createMany({
      data: [
        { email: 'pattern1@test.com', name: 'Pattern 1' },
        { email: 'pattern2@test.com', name: 'Pattern 2' },
        { email: 'pattern3@test.com', name: 'Pattern 3' },
      ],
    })

    const users = await prisma.user.findMany({
      where: {
        email: {
          endsWith: '@test.com',
        },
      },
    })

    expect(users.length).toBeGreaterThanOrEqual(3)
  })
})
