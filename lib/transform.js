import got from 'got'
import sizeOf from 'image-size'

async function transform (text) {
  const regex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/g
  const matches = [...text.matchAll(regex)]
  if (matches.length === 0) return text

  for (const m of matches) {
    const link = m[0]
    const { headers } = await got.get(link)
    const contentType = headers['content-type']
    if (contentType.includes('image')) {
      const buffer = await got.get(link).buffer()
      const { width, height } = sizeOf(buffer)
      text = text.replace(link, `<img src="${link}" width="${width}" height="${height}" decoding="async" loading="lazy"/>`)
    }
  }

  return text
}

export default transform