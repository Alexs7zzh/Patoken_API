'use strict'
import transform from '../lib/transform.js'

const getOpts = {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        author: { type: 'string' },
        id: { type: 'array' }
      }
    },
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            text: { type: 'string' },
            quote: { type: 'string' },
            postId: { type: 'string' },
            category: { type: 'string' },
            author: { type: 'string' },
            selectors: { type: 'array' }
          }
        }
      }
    }
  }
}

const postOpts = {
  schema: {
    body: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        quote: { type: 'string' },
        postId: { type: 'string' },
        postAuthor: { type: 'string' },
        category: { type: 'string' },
        selectors: { type: 'array' }
      },
    }
  }
}

const deleteOpts = {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    }
  }
}

const putOpts = {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    },
    body: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        category: { type: 'string' },
      },
      required: ['text', 'category']
    }
  }
}

async function route (fastify) {
  fastify.get('/comment', getOpts, async (request, reply) => {
    let options = {}
    if (request.query.author) options = { postAuthor: request.query.author }
    else if (request.query.id) options = { postId: { in: request.query.id } }
    else throw { statusCode: 400, message: 'Invalid request' }

    const comments = (await fastify.prisma.comment.findMany({
      where: options,
      select: {
        id: true,
        text: true,
        quote: true,
        selectors: true,
        postId: true,
        category: true,
        author: {
          select: {
            name: true
          }
        }
      }
    })).map(i => ({ ...i, author: i.author.name }))

    reply.status(200).send(comments)
  })

  fastify.post('/comment', postOpts, async (request, reply) => {
    try {
      if (!request.user) throw { statusCode: 401, message: 'Unauthorized' }
      const { id: userId } = await fastify.prisma.user.findUnique({
        where: {
          email: request.user.email
        }
      })

      const text = await transform(request.body.text)

      await fastify.prisma.comment.create({
        data: {
          text,
          selectors: request.body.selectors,
          quote: request.body.quote,
          author: {
            connect: { id: userId }
          },
          postId: request.body.postId,
          postAuthor: request.body.postAuthor,
          category: request.body.category
        }
      })
      reply.status(201).send()
    } catch (err) {
      console.log(err)
      throw { statusCode: 500, message: err.message }
    }
  })

  fastify.delete('/comment', deleteOpts, async (request, reply) => {
    if (!request.user) throw { statusCode: 401, message: 'Unauthorized' }
    const { id: userId } = await fastify.prisma.user.findUnique({
      where: {
        email: request.user.email
      }
    })
    const comment = await fastify.prisma.comment.findUnique({
      where: {
        id: Number(request.query.id)
      },
      select: {
        authorId: true
      }
    })
    if (comment.authorId === userId) {
      await fastify.prisma.comment.delete({
        where: {
          id: Number(request.query.id)
        }
      })
      reply.status(204).send()
    } else throw { statusCode: 500 }
  })

  fastify.put('/comment', putOpts, async (request, reply) => {
    if (!request.user) throw { statusCode: 401, message: 'Unauthorized' }
    const { id: userId } = await fastify.prisma.user.findUnique({
      where: {
        email: request.user.email
      }
    })
    const comment = await fastify.prisma.comment.findUnique({
      where: {
        id: Number(request.query.id)
      },
      select: {
        authorId: true
      }
    })
    if (comment.authorId === userId) {
      const text = await transform(request.body.text)

      await fastify.prisma.comment.update({
        where: {
          id: Number(request.query.id)
        },
        data: {
          text,
          category: request.body.category
        }
      })
      reply.status(204).send()
    } else throw { statusCode: 401, message: 'Unauthorized' }
  })
}

export default route