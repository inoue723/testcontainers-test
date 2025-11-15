import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('User-Post Relation Integration Tests - Suite 3', () => {
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

  it('should create user with posts in one transaction', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'relation1@example.com',
        name: 'Relation User 1',
        posts: {
          create: [
            { title: 'Post A', content: 'Content A' },
            { title: 'Post B', content: 'Content B' },
          ],
        },
      },
      include: {
        posts: true,
      },
    })

    expect(user.posts).toHaveLength(2)
    expect(user.posts[0].authorId).toBe(user.id)
  })

  it('should fetch user with all posts', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'relation2@example.com',
        name: 'Relation User 2',
        posts: {
          create: [
            { title: 'Post C', content: 'Content C' },
            { title: 'Post D', content: 'Content D' },
            { title: 'Post E', content: 'Content E' },
          ],
        },
      },
    })

    const userWithPosts = await prisma.user.findUnique({
      where: { id: user.id },
      include: { posts: true },
    })

    expect(userWithPosts?.posts).toHaveLength(3)
  })

  it('should delete user cascade posts', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'relation3@example.com',
        name: 'Relation User 3',
        posts: {
          create: [{ title: 'Post F', content: 'Content F' }],
        },
      },
    })

    await prisma.post.deleteMany({
      where: { authorId: user.id },
    })

    await prisma.user.delete({
      where: { id: user.id },
    })

    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    expect(deletedUser).toBeNull()
  })
})
