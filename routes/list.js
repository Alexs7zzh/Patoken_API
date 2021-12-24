'use strict'

const getOpts = {
  schema: {
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            text: { type: 'string' },
            category: { type: 'string' },
            author: { type: 'string' },
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
        name: { type: 'string' },
        text: { type: 'string' },
        category: { type: 'string' }
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
        name: { type: 'string' },
        text: { type: 'string' },
        category: { type: 'string' },
      },
      required: ['name', 'text', 'category']
    }
  }
}

async function route (fastify) {
  fastify.get('/list', getOpts, async (request, reply) => {
    const stuff = (await fastify.prisma.stuff.findMany({
      select: {
        id: true,
        name: true,
        text: true,
        category: true,
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }))
      .map(i => ({ ...i, author: i.author.name }))

    reply.status(200).send(stuff)
  })

  fastify.post('/list', postOpts, async (request, reply) => {
    try {
      if (!request.user) throw { statusCode: 401, message: 'Unauthorized' }
      const { id: userId } = await fastify.prisma.user.findUnique({
        where: {
          email: request.user.email
        }
      })

      await fastify.prisma.stuff.create({
        data: {
          name: request.body.name,
          text: request.body.text,
          category: request.body.category,
          author: {
            connect: { id: userId }
          }
        }
      })

      reply.status(201).send()
    } catch (err) {
      console.log(err)
      throw { statusCode: 500, message: err.message }
    }
  })

  fastify.delete('/list', deleteOpts, async (request, reply) => {
    if (!request.user) throw { statusCode: 401, message: 'Unauthorized' }
    const { id: userId } = await fastify.prisma.user.findUnique({
      where: {
        email: request.user.email
      }
    })
    const stuff = await fastify.prisma.stuff.findUnique({
      where: {
        id: Number(request.query.id)
      },
      select: {
        authorId: true
      }
    })
    if (stuff.authorId === userId) {
      await fastify.prisma.stuff.delete({
        where: {
          id: Number(request.query.id)
        }
      })
      reply.status(204).send()
    } else throw { statusCode: 500 }
  })

  fastify.put('/list', putOpts, async (request, reply) => {
    if (!request.user) throw { statusCode: 401, message: 'Unauthorized' }
    const { id: userId } = await fastify.prisma.user.findUnique({
      where: {
        email: request.user.email
      }
    })
    const stuff = await fastify.prisma.stuff.findUnique({
      where: {
        id: Number(request.query.id)
      },
      select: {
        authorId: true
      }
    })
    if (stuff.authorId === userId) {
      await fastify.prisma.stuff.update({
        where: {
          id: Number(request.query.id)
        },
        data: {
          name: request.body.name,
          text: request.body.text,
          category: request.body.category,
        }
      })
      reply.status(204).send()
    } else throw { statusCode: 401, message: 'Unauthorized' }
  })
}

export default route