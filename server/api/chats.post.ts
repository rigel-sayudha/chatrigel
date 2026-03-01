import { db, schema } from '../db'

export default defineEventHandler(async (event) => {
    let sessionId = getCookie(event, 'chat_session')

    if (!sessionId) {
        sessionId = crypto.randomUUID()
        setCookie(event, 'chat_session', sessionId, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
        })
    }

    const [chat] = await db.insert(schema.chats).values({
        sessionId,
    }).returning()

    return chat
})
