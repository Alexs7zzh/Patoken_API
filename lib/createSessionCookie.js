import { serialize } from 'cookie'
import Iron from '@hapi/iron'
import { SESSION_NAME, ENCRYPTION_SECRET } from './constants.js'

const SESSION_LENGTH_MS = 604800000

async function encrypt(data) {
	return data && Iron.seal(data, ENCRYPTION_SECRET, Iron.defaults)
}

async function createSessionCookie(data) {
	const encrypted_data = await encrypt(data)

	return serialize(SESSION_NAME, encrypted_data, {
		maxAge: SESSION_LENGTH_MS / 1000,
		expires: new Date(Date.now() + SESSION_LENGTH_MS),
		httpOnly: true,
		secure: true,
		path: '/',
		sameSite: 'none'
	})
}

export default createSessionCookie