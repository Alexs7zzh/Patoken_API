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
            tag: { type: 'string' },
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
        tag: { type: 'string' }
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
        tag: { type: 'string' },
      },
      required: ['name', 'text', 'tag']
    }
  }
}

async function route (fastify) {
  fastify.get('/list', getOpts, async (request, reply) => {
    const stuff = (await fastify.prisma.comment.findMany({
      select: {
        id: true,
        name: true,
        text: true,
        tag: true,
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
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
          tag: request.body.tag,
          author: {
            connect: { id: userId }
          }
        }
      })

      reply.status(200).send()
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
      reply.status(200).send()
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
          tag: request.body.tag,
        }
      })
      reply.status(200).send()
    } else throw { statusCode: 401, message: 'Unauthorized' }
  })
}

export default route