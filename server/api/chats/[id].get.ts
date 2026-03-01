import { db, schema } from '../../db'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const sessionId = getCookie(event, 'chat_session')
    if (!sessionId) {
        throw createError({ statusCode: 401, statusMessage: 'No session' })
    }

    const id = getRouterParam(event, 'id')!

    const chat = await db.query.chats.findFirst({
        where: () => and(
            eq(schema.chats.id, id),
            eq(schema.chats.sessionId, sessionId),
        ),
        with: {
            messages: {
                orderBy: (messages, { asc }) => [asc(messages.createdAt)],
            },
        },
    })

    if (!chat) {
        throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
    }

    return chat
})
