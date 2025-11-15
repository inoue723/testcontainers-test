import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { setupDatabase } from './setup'

describe('Conflict Post Title Tests - Suite 7', () => {
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

  it('should create post with title "Breaking News"', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'journalist1@example.com',
        name: 'Journalist 1',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: 'Breaking News',
        content: 'This is breaking news from test suite 7',
        authorId: user.id,
      },
    })

    expect(post.title).toBe('Breaking News')
  })

  it('should search posts by title "Important Update"', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'journalist2@example.com',
        name: 'Journalist 2',
      },
    })

    await prisma.post.create({
      data: {
        title: 'Important Update',
        content: 'Content here',
        authorId: user.id,
      },
    })

    const posts = await prisma.post.findMany({
      where: {
        title: 'Important Update',
      },
    })

    expect(posts.length).toBeGreaterThan(0)
  })

  it('should update post title to "Updated Title"', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'journalist3@example.com',
        name: 'Journalist 3',
      },
    })

    const post = await prisma.post.create({
      data: {
        title: 'Old Title',
        content: 'Content',
        authorId: user.id,
      },
    })

    const updated = await prisma.post.update({
      where: { id: post.id },
      data: { title: 'Updated Title' },
    })

    expect(updated.title).toBe('Updated Title')
  })

  it('should count posts with title containing "Test"', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'journalist4@example.com',
        name: 'Journalist 4',
      },
    })

    await prisma.post.createMany({
      data: [
        { title: 'Test Post 1', content: 'Content', authorId: user.id },
        { title: 'Test Post 2', content: 'Content', authorId: user.id },
        { title: 'Another Test', content: 'Content', authorId: user.id },
      ],
    })

    const count = await prisma.post.count({
      where: {
        authorId: user.id,
        title: {
          contains: 'Test',
        },
      },
    })

    expect(count).toBe(3)
  })
})
