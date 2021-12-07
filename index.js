import Fastify from 'fastify'
import Ajv from 'ajv'
import dotenv from 'dotenv'
import cookie from 'fastify-cookie'
import cors from 'fastify-cors'
import pkg from '@prisma/client'
import { Magic } from '@magic-sdk/admin'
import getSession from './lib/getSession.js'

import commentRoute from './routes/comment.js'
import loginRoute from './routes/login.js'
import userRoute from './routes/user.js'
import listRoute from './routes/list.js'

dotenv.config()

const { PrismaClient } = pkg
const ajv = new Ajv({
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: 'array',
  allErrors: true
})

const fastify = Fastify({
  logger: true
})

fastify.setValidatorCompiler(({ schema }) => {
  return ajv.compile(schema)
})
fastify.register(cookie)
fastify.register(cors, {
  origin: [/localhost/, /patoken\.org$/],
  credentials: true
})
fastify.decorate('prisma', new PrismaClient())
fastify.decorate('magic', new Magic(process.env.MAGIC_SECRET_KEY))

fastify.decorateRequest('user', undefined)
fastify.addHook('preHandler', async (request, reply) => {
  const session = request.cookies.session
  console.log('session', session)
  if (session) {
    const user = await getSession(session)
    request.user = user
    console.log('user', user)
  }
})

fastify.register(commentRoute)
fastify.register(loginRoute)
fastify.register(userRoute)
fastify.register(listRoute)

const start = async () => {
  try {
    await fastify.listen(3001, '0.0.0.0')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()