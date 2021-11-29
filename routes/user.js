import prisma from '../lib/prisma.js'
import { SESSION_NAME } from '../lib/constants.js'
import getSession from '../lib/getSession.js'
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
    }
  }
}

async function route (fastify) {
  fastify.get('/user', getOpts, async (request, reply) => {
    try {
      const session = request.cookies[SESSION_NAME]
      if (!session) {
        reply.status(200).send()
        return
      }

      const user = await getSession(session)

      if (!user.name && user.email) {
				const { name } = await prisma.user.findUnique({
					where: {
						email: user.email
					}
				})
				user.name = name
			}
      console.log(user)
      const cookie = await createSessionCookie(user)

      reply.header('Set-Cookie', cookie)
      reply.status(200).send({ user })
    } catch (err) {
      throw { statusCode: 500, message: err.message }
    }
  })

  fastify.post('/user', postOpts, async (request, reply) => {
    try {
      const session = request.cookies[SESSION_NAME]
      if (!session) throw { statusCode: 401, message: 'Unauthorized' }

			const user = await getSession(session)
			await prisma.user.create({
				data: {
					email: user.email,
					name: request.body.name
				}
			})

			reply.status(200).send()
		} catch (err) {
      throw { statusCode: 500, message: err.message }
		}
  })
}

export default route