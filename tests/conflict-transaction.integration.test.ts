import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Conflict Transaction Tests - Suite 11', () => {
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

  it('should create user and posts in transaction', async () => {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: 'transaction1@example.com',
          name: 'Transaction User 1',
        },
      })

      const post1 = await tx.post.create({
        data: {
          title: 'Transaction Post 1',
          content: 'Content',
          authorId: user.id,
        },
      })

      const post2 = await tx.post.create({
        data: {
          title: 'Transaction Post 2',
          content: 'Content',
          authorId: user.id,
        },
      })

      return { user, posts: [post1, post2] }
    })

    expect(result.user.email).toBe('transaction1@example.com')
    expect(result.posts).toHaveLength(2)
  })

  it('should rollback transaction on error', async () => {
    let userId: number | undefined

    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: 'rollback@example.com',
            name: 'Rollback User',
          },
        })

        userId = user.id

        // This should fail if duplicate email
        await tx.user.create({
          data: {
            email: 'rollback@example.com', // Duplicate email
            name: 'Duplicate User',
          },
        })
      })
    } catch (error) {
      // Expected to fail
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })
      // Transaction should have rolled back
      expect(user).toBeNull()
    }
  })

  it('should update multiple records in transaction', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'transaction2@example.com',
        name: 'Transaction User 2',
        posts: {
          create: [
            { title: 'Unpublished 1', content: 'Content' },
            { title: 'Unpublished 2', content: 'Content' },
          ],
        },
      },
    })

    await prisma.$transaction([
      prisma.post.updateMany({
        where: { authorId: user.id },
        data: { published: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { name: 'Updated Transaction User' },
      }),
    ])

    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
    })

    expect(posts.every(p => p.published)).toBe(true)
  })

  it('should handle concurrent transactions', async () => {
    const results = await Promise.all([
      prisma.$transaction(async (tx) => {
        return tx.user.create({
          data: {
            email: 'concurrent1@example.com',
            name: 'Concurrent User 1',
          },
        })
      }),
      prisma.$transaction(async (tx) => {
        return tx.user.create({
          data: {
            email: 'concurrent2@example.com',
            name: 'Concurrent User 2',
          },
        })
      }),
      prisma.$transaction(async (tx) => {
        return tx.user.create({
          data: {
            email: 'concurrent3@example.com',
            name: 'Concurrent User 3',
          },
        })
      }),
    ])

    expect(results).toHaveLength(3)
    expect(results.every(r => r.id)).toBe(true)
  })
})
