import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Conflict User Name Tests - Suite 8', () => {
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

  it('should create user named "John Doe"', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'john.doe.1@example.com',
        name: 'John Doe',
      },
    })

    expect(user.name).toBe('John Doe')
  })

  it('should create multiple users with name "Admin"', async () => {
    const user1 = await prisma.user.create({
      data: {
        email: 'admin1@example.com',
        name: 'Admin',
      },
    })

    const user2 = await prisma.user.create({
      data: {
        email: 'admin2@example.com',
        name: 'Admin',
      },
    })

    expect(user1.name).toBe('Admin')
    expect(user2.name).toBe('Admin')
  })

  it('should find all users named "Test User"', async () => {
    await prisma.user.createMany({
      data: [
        { email: 'test.user.1@example.com', name: 'Test User' },
        { email: 'test.user.2@example.com', name: 'Test User' },
        { email: 'test.user.3@example.com', name: 'Test User' },
      ],
    })

    const users = await prisma.user.findMany({
      where: {
        name: 'Test User',
      },
    })

    expect(users.length).toBeGreaterThanOrEqual(3)
  })

  it('should update all users named "Old Name" to "New Name"', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'oldname@example.com',
        name: 'Old Name',
      },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { name: 'New Name' },
    })

    const updated = await prisma.user.findUnique({
      where: { id: user.id },
    })

    expect(updated?.name).toBe('New Name')
  })
})
