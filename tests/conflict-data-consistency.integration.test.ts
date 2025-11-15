import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Conflict Data Consistency Tests - Suite 15', () => {
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

  it('should verify user-post relationship consistency', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'consistency1@example.com',
        name: 'Consistency User 1',
        posts: {
          create: [
            { title: 'Related Post 1', content: 'Content' },
            { title: 'Related Post 2', content: 'Content' },
          ],
        },
      },
    })

    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
      include: { author: true },
    })

    expect(posts).toHaveLength(2)
    expect(posts.every(p => p.author.id === user.id)).toBe(true)
  })

  it('should ensure all posts have valid authors', async () => {
    const allPosts = await prisma.post.findMany({
      include: { author: true },
    })

    expect(allPosts.every(p => p.author !== null)).toBe(true)
  })

  it('should verify email uniqueness after updates', async () => {
    const user1 = await prisma.user.create({
      data: {
        email: 'unique-check-1@example.com',
        name: 'User 1',
      },
    })

    const user2 = await prisma.user.create({
      data: {
        email: 'unique-check-2@example.com',
        name: 'User 2',
      },
    })

    await prisma.user.update({
      where: { id: user1.id },
      data: { email: 'updated-unique-1@example.com' },
    })

    const users = await prisma.user.findMany({
      where: {
        id: { in: [user1.id, user2.id] },
      },
    })

    const emails = users.map(u => u.email)
    expect(new Set(emails).size).toBe(2)
  })

  it('should check data integrity after bulk operations', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'bulk-integrity@example.com',
        name: 'Bulk Integrity User',
      },
    })

    await prisma.post.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        title: `Bulk Post ${i}`,
        content: 'Content',
        authorId: user.id,
      })),
    })

    const count = await prisma.post.count({
      where: { authorId: user.id },
    })

    expect(count).toBe(10)
  })

  it('should verify no orphaned records exist', async () => {
    // Get all user IDs
    const users = await prisma.user.findMany({ select: { id: true } })
    const userIds = users.map(u => u.id)

    // Check all posts have valid authors
    const posts = await prisma.post.findMany()
    const allPostsHaveValidAuthors = posts.every(p => userIds.includes(p.authorId))

    expect(allPostsHaveValidAuthors).toBe(true)
  })
})
