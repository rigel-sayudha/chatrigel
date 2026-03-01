import {
    convertToModelMessages,
    createUIMessageStream,
    createUIMessageStreamResponse,
    generateText,
    smoothStream,
    stepCountIs,
    streamText,
} from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import { db, schema } from '../../db'
import { and, eq } from 'drizzle-orm'
import { weatherTool } from '../../../shared/utils/tools/weather'
import { chartTool } from '../../../shared/utils/tools/chart'
import type { UIMessage } from 'ai'

export default defineEventHandler(async (event) => {
    const sessionId = getCookie(event, 'chat_session')
    if (!sessionId) {
        throw createError({ statusCode: 401, statusMessage: 'No session' })
    }

    const id = getRouterParam(event, 'id')!
    const config = useRuntimeConfig(event)

    const { model, messages } = await readValidatedBody(event, z.object({
        model: z.string().default('openai/gpt-4o-mini'),
        messages: z.array(z.custom<UIMessage>()),
    }).parse)

    const chat = await db.query.chats.findFirst({
        where: () => and(
            eq(schema.chats.id, id),
            eq(schema.chats.sessionId, sessionId),
        ),
        with: {
            messages: true,
        },
    })

    if (!chat) {
        throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
    }

    // Create AI gateway client
    const gateway = createGateway({
        apiKey: config.aiGatewayKey,
    })

    // Generate title for new chats
    if (!chat.title && messages.length > 0) {
        const { text: title } = await generateText({
            model: gateway(model),
            system: `You are a title generator for a chat:
          - Generate a short title based on the first user's message
          - The title should be less than 30 characters long
          - The title should be a summary of the user's message
          - Do not use quotes (' or ") or colons (:) or any other punctuation
          - Do not use markdown, just plain text`,
            prompt: JSON.stringify(messages[0]),
        })

        await db.update(schema.chats).set({ title }).where(eq(schema.chats.id, id))
    }

    // Save last user message (when continuing a conversation)
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user' && messages.length > 1) {
        await db.insert(schema.messages).values({
            chatId: id,
            role: 'user',
            parts: lastMessage.parts,
        })
    }

    const stream = createUIMessageStream({
        execute: async ({ writer }) => {
            const result = streamText({
                model: gateway(model),
                system: `You are a knowledgeable and helpful AI assistant. Your goal is to provide clear, accurate, and well-structured responses.

**FORMATTING RULES:**
- Use **bold text** for emphasis and section labels
- Use bullet points for lists
- Break down complex topics into digestible parts
- Maintain a friendly, professional tone`,
                messages: await convertToModelMessages(messages),
                stopWhen: stepCountIs(5),
                experimental_transform: smoothStream({ chunking: 'word' }),
                tools: {
                    weather: weatherTool,
                    chart: chartTool
                }
            })

            if (!chat.title) {
                writer.write({
                    type: 'data-chat-title',
                    data: { message: 'Generating title...' },
                    transient: true
                })
            }

            writer.merge(result.toUIMessageStream())
        },
        onFinish: async ({ messages: finishedMessages }) => {
            // Save assistant messages to DB
            const assistantMessages = finishedMessages.filter(m => m.role === 'assistant')
            if (assistantMessages.length > 0) {
                await db.insert(schema.messages).values(
                    assistantMessages.map(message => ({
                        chatId: id,
                        role: message.role as 'user' | 'assistant',
                        parts: message.parts,
                    })),
                )
            }

            // Save first user message for new chats
            if (messages.length === 1 && lastMessage?.role === 'user') {
                const existingMsg = await db.query.messages.findFirst({
                    where: eq(schema.messages.chatId, id),
                })
                if (!existingMsg) {
                    await db.insert(schema.messages).values({
                        chatId: id,
                        role: 'user',
                        parts: lastMessage.parts,
                    })
                }
            }
        },
    })

    return createUIMessageStreamResponse({ stream })
})
