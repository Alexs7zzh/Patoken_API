import prisma from '../lib/prisma.js'
import { SESSION_NAME } from '../lib/constants.js'
import getSession from '../lib/getSession.js'

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
            updatedAt: { type: 'string' },
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

    const comments = (await prisma.comment.findMany({
      where: options,
      select: {
        id: true,
        text: true,
        quote: true,
        selectors: true,
        postId: true,
        updatedAt: true,
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

  fastify.register(async function protected (app) {
    app.decorateRequest('userId', '')

    app.addHook('preHandler', async (request, reply) => {
      const session = req.cookies[SESSION_NAME]
      if (!session) throw { statusCode: 401, message: 'Unauthorized' }
      const user = await getSession(session)
      const { userId } = await prisma.user.findUnique({
        where: {
          email: user.email
        }
      })
      request.userId = userId
    })

    app.post('/comment', postOpts, async (request, reply) => {
      try {
        await prisma.comment.create({
          data: {
            text: request.body.text,
            selectors: request.body.selectors,
            quote: request.body.quote,
            author: {
              connect: { id: request.userId }
            },
            postId: request.body.postId,
            postAuthor: request.body.postAuthor,
            category: request.body.category
          }
        })
        reply.status(200).send()
      } catch (err) {
        throw { statusCode: 500, message: err.message }
      }
    })

    app.delete('/comment', deleteOpts, async (request, reply) => {
      const comment = await prisma.comment.findUnique({
        where: {
          id: Number(request.query.id)
        },
        select: {
          authorId: true
        }
      })
      if (comment.authorId === request.userId) {
				await prisma.comment.delete({
					where: {
						id: Number(request.query.id)
					}
				})
				reply.status(200).send()
			} else throw { statusCode: 401, message: 'Unauthorized' }
    })

    app.put('/comment', putOpts, async (request, reply) => {
      const comment = await prisma.comment.findUnique({
        where: {
          id: Number(request.query.id)
        },
        select: {
          authorId: true
        }
      })
      if (comment.authorId === request.userId) {
				await prisma.comment.update({
					where: {
						id: Number(request.query.id)
					},
					data: {
						text: requst.body.text,
						category: requst.body.category
					}
				})
				reply.status(200).send()
			} else throw { statusCode: 401, message: 'Unauthorized' }
    })
  })
}

export default route