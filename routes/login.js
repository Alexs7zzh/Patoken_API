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
      const didToken = fastify.magic.utils.parseAuthorizationHeader(request.headers['authorization'])
      fastify.magic.token.validate(didToken)

      const metadata = await fastify.magic.users.getMetadataByToken(didToken)
      const result = await fastify.prisma.user.findUnique({
        where: {
          email: metadata.email
        }
      })

      const cookie = await createSessionCookie({
        email: metadata.email,
        name: result && result.name
      })

      reply
        .header('Set-Cookie', cookie)
        .send({
          email: metadata.email,
          name: result && result.name
        })
    } catch (err) {
      throw { statusCode: 500, message: err.message }
    }
  })
}

export default route