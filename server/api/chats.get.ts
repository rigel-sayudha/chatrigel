import { db, schema } from '../db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const sessionId = getCookie(event, 'chat_session') || crypto.randomUUID()

    // Set session cookie if not exists
    if (!getCookie(event, 'chat_session')) {
        setCookie(event, 'chat_session', sessionId, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        })
    }

    const chats = await db.query.chats.findMany({
        where: () => eq(schema.chats.sessionId, sessionId),
        orderBy: (chats, { desc }) => [desc(chats.createdAt)],
    })

    return chats
})
