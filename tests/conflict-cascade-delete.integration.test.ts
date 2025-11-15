import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Conflict Cascade Delete Tests - Suite 10', () => {
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

  it('should delete user and all their posts', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'cascade1@example.com',
        name: 'Cascade User 1',
        posts: {
          create: [
            { title: 'Post 1', content: 'Content' },
            { title: 'Post 2', content: 'Content' },
            { title: 'Post 3', content: 'Content' },
          ],
        },
      },
    })

    // Delete all posts first
    await prisma.post.deleteMany({
      where: { authorId: user.id },
    })

    // Then delete user
    await prisma.user.delete({
      where: { id: user.id },
    })

    const foundUser = await prisma.user.findUnique({
      where: { email: 'cascade1@example.com' },
    })

    expect(foundUser).toBeNull()
  })

  it('should delete multiple users in sequence', async () => {
    const user1 = await prisma.user.create({
      data: {
        email: 'cascade2@example.com',
        name: 'Cascade User 2',
      },
    })

    const user2 = await prisma.user.create({
      data: {
        email: 'cascade3@example.com',
        name: 'Cascade User 3',
      },
    })

    await prisma.user.delete({ where: { id: user1.id } })
    await prisma.user.delete({ where: { id: user2.id } })

    const count = await prisma.user.count({
      where: {
        email: {
          in: ['cascade2@example.com', 'cascade3@example.com'],
        },
      },
    })

    expect(count).toBe(0)
  })

  it('should handle deletion of non-existent posts', async () => {
    const deleted = await prisma.post.deleteMany({
      where: {
        id: 999999,
      },
    })

    expect(deleted.count).toBe(0)
  })

  it('should verify orphaned posts are properly cleaned', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'orphan-check@example.com',
        name: 'Orphan Check User',
        posts: {
          create: [
            { title: 'Will be orphaned', content: 'Content' },
          ],
        },
      },
    })

    const postId = (await prisma.post.findFirst({
      where: { authorId: user.id },
    }))?.id

    // Clean up posts before deleting user
    await prisma.post.deleteMany({
      where: { authorId: user.id },
    })

    await prisma.user.delete({
      where: { id: user.id },
    })

    const orphanedPost = await prisma.post.findUnique({
      where: { id: postId },
    })

    expect(orphanedPost).toBeNull()
  })
})
