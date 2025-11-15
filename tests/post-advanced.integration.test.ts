import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Post Advanced Integration Tests - Suite 5', () => {
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

  it('should filter published posts', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'postadv1@example.com',
        name: 'Post Adv User 1',
        posts: {
          create: [
            { title: 'Published 1', content: 'Content', published: true },
            { title: 'Draft 1', content: 'Content', published: false },
            { title: 'Published 2', content: 'Content', published: true },
          ],
        },
      },
    })

    const published = await prisma.post.findMany({
      where: {
        authorId: user.id,
        published: true,
      },
    })

    expect(published).toHaveLength(2)
  })

  it('should count posts by author', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'postadv2@example.com',
        name: 'Post Adv User 2',
        posts: {
          create: [
            { title: 'Count 1', content: 'Content' },
            { title: 'Count 2', content: 'Content' },
            { title: 'Count 3', content: 'Content' },
            { title: 'Count 4', content: 'Content' },
          ],
        },
      },
    })

    const count = await prisma.post.count({
      where: { authorId: user.id },
    })

    expect(count).toBe(4)
  })

  it('should order posts by creation date', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'postadv3@example.com',
        name: 'Post Adv User 3',
      },
    })

    // Create posts sequentially to ensure createdAt order
    await prisma.post.create({
      data: { title: 'First', content: 'Content', authorId: user.id },
    })
    await prisma.post.create({
      data: { title: 'Second', content: 'Content', authorId: user.id },
    })
    await prisma.post.create({
      data: { title: 'Third', content: 'Content', authorId: user.id },
    })

    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    expect(posts[0].title).toBe('Third')
    expect(posts[2].title).toBe('First')
  })
})
