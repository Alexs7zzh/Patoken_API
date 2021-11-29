import createSessionCookie from '../lib/createSessionCookie.js'

const getOpts = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          name: { type: 'string' }
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
        name: { type: 'string' }
      },
      required: ['name']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          name: { type: 'string' }
        },
      }
    }
  }
}

async function route (fastify) {
  fastify.get('/user', getOpts, async (request, reply) => {
    try {
      if (!request.user) {
        reply.status(200).send()
        return
      }

      if (!request.user.name && request.user.email) {
				const { name } = await fastify.prisma.user.findUnique({
					where: {
						email: request.user.email
					}
				})
				request.user.name = name
			}

      const cookie = await createSessionCookie(request.user)

      reply
        .header('Set-Cookie', cookie)
        .send({ user: request.user })
    } catch (err) {
      throw { statusCode: 500, message: err.message }
    }
  })

  fastify.post('/user', postOpts, async (request, reply) => {
    try {
      if (!request.user) throw { statusCode: 401, message: 'Unauthorized' }

      const data = {
        email: request.user.email,
        name: request.body.name
      }

			await fastify.prisma.user.create({ data })

      const cookie = await createSessionCookie(data)

      reply
        .header('Set-Cookie', cookie)
        .send(data)
		} catch (err) {
      throw { statusCode: 500, message: err.message }
		}
  })
}

export default route