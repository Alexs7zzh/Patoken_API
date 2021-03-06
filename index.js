import Fastify from 'fastify'
import Ajv from 'ajv'
import dotenv from 'dotenv'
import cookie from 'fastify-cookie'
import cors from 'fastify-cors'
import websocket from 'fastify-websocket'
import pkg from '@prisma/client'
import got from 'got'
import { Magic } from '@magic-sdk/admin'
import cron from 'node-cron'
import getSession from './lib/getSession.js'
import sendMail from './newsletter/index.js'

import commentRoute from './routes/comment.js'
import loginRoute from './routes/login.js'
import userRoute from './routes/user.js'
import listRoute from './routes/list.js'
import drawRoute from './routes/draw.js'

dotenv.config()

cron.schedule('0 9 * * MON', () => {
  sendMail().catch(console.error)
}, { timezone: 'Asia/Tokyo' })

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
  origin: [/localhost/, /patoken\.org$/, /patoken-alexzzhs7\.vercel\.app/],
  credentials: true
})
fastify.register(websocket)
fastify.decorate('prisma', new PrismaClient())
fastify.decorate('magic', new Magic(process.env.MAGIC_SECRET_KEY))

fastify.decorateRequest('user', undefined)
fastify.addHook('preHandler', async (request, reply) => {
  const session = request.cookies.session
  if (session) {
    const user = await getSession(session)
    request.user = user
    console.log('user', user)
  }
})
fastify.addHook('onError', async (request, reply, error) => {
  const content = `${reply.statusCode} [${request.method}] ${request.url}  
User: ${request.user ? request.user.name : 'None'}  
${error.message}`

  await got.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: content,
      parse_mode: 'markdown',
      disable_web_page_preview: true
    })
  })
})
fastify.addHook('onResponse', async (request, reply) => {
  if (reply.statusCode >= 300) {
    const content = `${reply.statusCode} [${request.method}] ${request.url}  
  User: ${request.user ? request.user.name : 'None'}`

    await got.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: content,
        parse_mode: 'markdown',
        disable_web_page_preview: true
      })
    })
  }
})

fastify.get('/', (request, reply) => {
  reply.status(103).send()
})
fastify.register(commentRoute)
fastify.register(loginRoute)
fastify.register(userRoute)
fastify.register(listRoute)
fastify.register(drawRoute)

const start = async () => {
  try {
    await fastify.listen(3001, '0.0.0.0')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()