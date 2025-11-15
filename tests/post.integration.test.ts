import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Post Integration Tests - Suite 2', () => {
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

  it('should create a post with author', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'author1@example.com',
        name: 'Author 1',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: 'Test Post 1',
        content: 'This is a test post',
        authorId: user.id,
      },
    })

    expect(post.id).toBeDefined()
    expect(post.title).toBe('Test Post 1')
    expect(post.authorId).toBe(user.id)
  })

  it('should find posts by author', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'author2@example.com',
        name: 'Author 2',
        posts: {
          create: [
            { title: 'Post 1', content: 'Content 1' },
            { title: 'Post 2', content: 'Content 2' },
          ],
        },
      },
    })

    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
    })

    expect(posts).toHaveLength(2)
  })

  it('should publish a post', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'author3@example.com',
        name: 'Author 3',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: 'Draft Post',
        content: 'This is a draft',
        authorId: user.id,
        published: false,
      },
    })

    const published = await prisma.post.update({
      where: { id: post.id },
      data: { published: true },
    })

    expect(published.published).toBe(true)
  })
})
