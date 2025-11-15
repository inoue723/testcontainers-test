import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Conflict Concurrent Writes Tests - Suite 12', () => {
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

  it('should handle concurrent user creations', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      prisma.user.create({
        data: {
          email: `concurrent-write-${i}@example.com`,
          name: `Concurrent User ${i}`,
        },
      })
    )

    const users = await Promise.all(promises)
    expect(users).toHaveLength(10)
    expect(new Set(users.map(u => u.id)).size).toBe(10)
  })

  it('should handle concurrent post creations for same user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'post-author@example.com',
        name: 'Post Author',
      },
    })

    const promises = Array.from({ length: 5 }, (_, i) =>
      prisma.post.create({
        data: {
          title: `Concurrent Post ${i}`,
          content: 'Content',
          authorId: user.id,
        },
      })
    )

    const posts = await Promise.all(promises)
    expect(posts).toHaveLength(5)
  })

  it('should handle concurrent updates to same user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'update-target@example.com',
        name: 'Update Target',
      },
    })

    const promises = Array.from({ length: 3 }, (_, i) =>
      prisma.user.update({
        where: { id: user.id },
        data: { name: `Updated Name ${i}` },
      })
    )

    const results = await Promise.all(promises)
    expect(results).toHaveLength(3)
  })

  it('should handle race condition in post publishing', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'publisher@example.com',
        name: 'Publisher',
        posts: {
          create: Array.from({ length: 5 }, (_, i) => ({
            title: `Draft ${i}`,
            content: 'Content',
            published: false,
          })),
        },
      },
    })

    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
    })

    const promises = posts.map(post =>
      prisma.post.update({
        where: { id: post.id },
        data: { published: true },
      })
    )

    await Promise.all(promises)

    const publishedPosts = await prisma.post.findMany({
      where: { authorId: user.id, published: true },
    })

    expect(publishedPosts).toHaveLength(5)
  })
})
