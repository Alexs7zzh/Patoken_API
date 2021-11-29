import { Magic } from '@magic-sdk/admin'

const MAGIC_SECRET_KEY = process.env.MAGIC_SECRET_KEY
const magic = new Magic(MAGIC_SECRET_KEY)

export default magic