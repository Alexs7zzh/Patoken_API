import Iron from '@hapi/iron'
import { ENCRYPTION_SECRET } from './constants.js'

async function decrypt(data) {
	return data && Iron.unseal(data, ENCRYPTION_SECRET, Iron.defaults)
}

async function getSession(cookie) {
	return await decrypt(cookie)
}

export default getSession