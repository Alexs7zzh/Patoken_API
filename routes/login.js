import prisma from '../lib/prisma.js'
import magic from '../lib/magic.js'
import createSessionCookie from '../lib/createSessionCookie.js'

const loginOpts = {
  schema: {
    headers: {
      type: 'object',
      properties: {
        'authorization': { type: 'string' }
      },
      required: ['authorization']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          name: { type: 'string', nullable: true }
        }
      }
    }
  }
}

async function route (fastify) {
  fastify.post('/login', loginOpts, async(request, reply) => {
    try {
      const didToken = magic.utils.parseAuthorizationHeader(request.headers['authorization'])
      magic.token.validate(didToken)

      const metadata = await magic.users.getMetadataByToken(didToken)
      const result = await prisma.user.findUnique({
        where: {
          email: metadata.email
        }
      })

      const cookie = await createSessionCookie({
        email: metadata.email,
        name: result && result.name
      })

      reply.header('Set-Cookie', cookie)
      reply.status(200).send({
        email: metadata.email,
        name: result && result.name
      })
    } catch (err) {
      throw { statusCode: 500, message: err.message }
    }
  })
}

export default route