import got from 'got'

async function transform (text) {
  const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
  const matches = [...text.matchAll(regex)]
  if (matches.length === 0) return text
  matches.forEach(async m => {
    const link = m[0]
    const { headers } = await got(link)
    const contentType = headers['content-type']
    if (contentType.includes('image'))
      text = text.replace(link, `<img src="${link}" decoding="async" loading="lazy"/>`)
  })
}

export default transform