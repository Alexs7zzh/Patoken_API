import GhostContentAPI from '@tryghost/content-api'
import nunjucks from "nunjucks"
import fs from 'fs'
import striptags from 'striptags'
import pkg from '@prisma/client'
import nodemailer from "nodemailer"
import dotenv from 'dotenv'

dotenv.config()

const api = new GhostContentAPI({
	url: process.env.GHOST_URL,
	key: process.env.GHOST_API,
	version: 'v3'
})
const { PrismaClient } = pkg
const prisma = new PrismaClient()

async function main() {
  let date = new Date()
  date.setDate(date.getDate() - 7)

  let posts = await api.posts.browse({ limit: 'all', include: 'authors', filter: `created_at:>=${date.toISOString()}` })
  for (let i of posts) {
		let match = i.title.match(/\d{4}\/(\d{1,2}\/\d{1,2})/)
		if (match) i.title = match[1]
	}
  posts = posts.map(i => ({
    title: i.title,
    slug: i.slug,
    html: striptags(i.html).slice(0, 140) + '…',
    author: i.primary_author.name,
    author_slug: i.primary_author.slug,
  }))

  const stuff = (await prisma.stuff.findMany({
    where: {
      updatedAt: {
        gte: date
      },
    },
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
  })).map(i => ({ ...i, author: i.author.name }))

  let comments = (await prisma.comment.findMany({
    where: {
      updatedAt: {
        gte: date
      },
    },
    select: {
      text: true,
      quote: true,
      postId: true,
      postAuthor: true,
      category: true,
      author: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })).map(i => ({ ...i, author: i.author.name }))
  
  if (posts.length === 0 && stuff.length === 0 && comments.length === 0) return
  
  const res = nunjucks.render('./newsletter/index.njk', { posts, stuff, comments, dev: process.env.NODE_ENV === 'dev' })
  
  if (process.env.NODE_ENV === 'dev')
    fs.writeFileSync('./newsletter/index.html', res)
  else {
    let transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })

    const addresses = (await prisma.user.findMany({
      select: {
        email: true
      }
    }))
      .map(i => i.email)
      .join(',')
    
    await transporter.sendMail({
      from: '"Patoken" <noreply@mail.patoken.org>',
      to: addresses,
      subject: "Patoken Newsletter",
      html: res
    })
  }
}

if (process.env.NODE_ENV === 'dev')
  main().catch(console.error)

export default main