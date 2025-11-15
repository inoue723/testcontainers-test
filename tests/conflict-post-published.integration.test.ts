import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Conflict Post Published Status Tests - Suite 14', () => {
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

  it('should create and publish multiple posts', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'publisher1@example.com',
        name: 'Publisher 1',
      },
    })

    const posts = await prisma.post.createMany({
      data: [
        { title: 'Published A', content: 'Content', published: true, authorId: user.id },
        { title: 'Published B', content: 'Content', published: true, authorId: user.id },
        { title: 'Published C', content: 'Content', published: true, authorId: user.id },
      ],
    })

    expect(posts.count).toBe(3)
  })

  it('should filter only published posts', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'publisher2@example.com',
        name: 'Publisher 2',
        posts: {
          create: [
            { title: 'Draft X', content: 'Content', published: false },
            { title: 'Published X', content: 'Content', published: true },
            { title: 'Draft Y', content: 'Content', published: false },
            { title: 'Published Y', content: 'Content', published: true },
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

  it('should toggle publish status', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'publisher3@example.com',
        name: 'Publisher 3',
        posts: {
          create: [
            { title: 'Toggle 1', content: 'Content', published: true },
          ],
        },
      },
    })

    const post = await prisma.post.findFirst({
      where: { authorId: user.id },
    })

    if (post) {
      await prisma.post.update({
        where: { id: post.id },
        data: { published: false },
      })

      await prisma.post.update({
        where: { id: post.id },
        data: { published: true },
      })

      const final = await prisma.post.findUnique({
        where: { id: post.id },
      })

      expect(final?.published).toBe(true)
    }
  })

  it('should count published vs unpublished posts', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'publisher4@example.com',
        name: 'Publisher 4',
        posts: {
          create: [
            { title: 'P1', content: 'Content', published: true },
            { title: 'P2', content: 'Content', published: true },
            { title: 'D1', content: 'Content', published: false },
          ],
        },
      },
    })

    const publishedCount = await prisma.post.count({
      where: { authorId: user.id, published: true },
    })

    const draftCount = await prisma.post.count({
      where: { authorId: user.id, published: false },
    })

    expect(publishedCount).toBe(2)
    expect(draftCount).toBe(1)
  })
})
