import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Conflict Bulk Operations Tests - Suite 9', () => {
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

  it('should bulk create users with similar emails', async () => {
    const users = await prisma.user.createMany({
      data: [
        { email: 'bulk1@example.com', name: 'Bulk User 1' },
        { email: 'bulk2@example.com', name: 'Bulk User 2' },
        { email: 'bulk3@example.com', name: 'Bulk User 3' },
        { email: 'bulk4@example.com', name: 'Bulk User 4' },
        { email: 'bulk5@example.com', name: 'Bulk User 5' },
      ],
    })

    expect(users.count).toBe(5)
  })

  it('should bulk delete posts by filter', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'bulk-delete@example.com',
        name: 'Bulk Delete User',
        posts: {
          create: [
            { title: 'Delete Me 1', content: 'Content' },
            { title: 'Delete Me 2', content: 'Content' },
            { title: 'Keep Me', content: 'Content' },
          ],
        },
      },
    })

    const deleted = await prisma.post.deleteMany({
      where: {
        authorId: user.id,
        title: {
          contains: 'Delete Me',
        },
      },
    })

    expect(deleted.count).toBe(2)
  })

  it('should bulk update post published status', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'bulk-update@example.com',
        name: 'Bulk Update User',
        posts: {
          create: [
            { title: 'Post 1', content: 'Content', published: false },
            { title: 'Post 2', content: 'Content', published: false },
            { title: 'Post 3', content: 'Content', published: false },
          ],
        },
      },
    })

    const updated = await prisma.post.updateMany({
      where: {
        authorId: user.id,
      },
      data: {
        published: true,
      },
    })

    expect(updated.count).toBe(3)
  })

  it('should count all users', async () => {
    const totalUsers = await prisma.user.count()
    expect(totalUsers).toBeGreaterThan(0)
  })

  it('should count all posts', async () => {
    const totalPosts = await prisma.post.count()
    expect(totalPosts).toBeGreaterThan(0)
  })
})
