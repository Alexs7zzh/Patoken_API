import Fastify from 'fastify'
import Ajv from 'ajv'
import dotenv from 'dotenv'
import cookie from 'fastify-cookie'
import cors from 'fastify-cors'

import commentRoute from './routes/comment.js'
import loginRoute from './routes/login.js'
import userRoute from './routes/user.js'

dotenv.config()

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

fastify.register(commentRoute)
fastify.register(loginRoute)
fastify.register(userRoute)

const start = async () => {
  try {
    await fastify.listen(3001, '0.0.0.0')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()