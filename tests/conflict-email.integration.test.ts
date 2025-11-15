import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Conflict Email Tests - Suite 6', () => {
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

  it('should create user with common email pattern 1', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'common@example.com',
        name: 'Common User A',
      },
    })

    expect(user.email).toBe('common@example.com')
    expect(user.name).toBe('Common User A')
  })

  it('should create user with admin email', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
      },
    })

    expect(user.email).toBe('admin@example.com')
  })

  it('should update user email to test@example.com', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'temp1@example.com',
        name: 'Temp User 1',
      },
    })

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { email: 'test@example.com' },
    })

    expect(updated.email).toBe('test@example.com')
  })

  it('should delete user with specific email', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'delete-me@example.com',
        name: 'Delete Me',
      },
    })

    await prisma.user.delete({
      where: { id: user.id },
    })

    const found = await prisma.user.findUnique({
      where: { email: 'delete-me@example.com' },
    })

    expect(found).toBeNull()
  })
})
