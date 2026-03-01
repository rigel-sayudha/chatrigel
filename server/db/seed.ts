import { db } from './index'
import { chats, messages } from './schema'
import crypto from 'crypto'

async function seed() {
    const chatId = crypto.randomUUID()
    const sessionId = 'test-session-id'

    // Create chat
    await db.insert(chats).values({
        id: chatId,
        title: 'Tool Call Demo',
        sessionId,
    })

    // Insert user message
    await db.insert(messages).values({
        id: crypto.randomUUID(),
        chatId,
        role: 'user',
        parts: [{ type: 'text', text: 'Show me the weather in Paris and a sales chart.' }]
    })

    // Insert assistant message with tool invocations
    await db.insert(messages).values({
        id: crypto.randomUUID(),
        chatId,
        role: 'assistant',
        parts: [
            { type: 'text', text: 'Here are the results you requested:' },
            {
                type: 'tool-invocation',
                toolInvocation: {
                    toolCallId: 'call_weather_1',
                    toolName: 'weather',
                    args: { location: 'Paris' },
                    state: 'result',
                    result: {
                        location: 'Paris, France',
                        temperature: 24,
                        condition: 'Partly Cloudy',
                        icon: 'i-lucide-cloud-sun',
                        forecast: [
                            { day: 'Mon', high: 24, low: 18, condition: 'Sunny' },
                            { day: 'Tue', high: 22, low: 16, condition: 'Rain' },
                            { day: 'Wed', high: 25, low: 19, condition: 'Sunny' }
                        ]
                    }
                }
            },
            {
                type: 'tool-invocation',
                toolInvocation: {
                    toolCallId: 'call_chart_1',
                    toolName: 'chart',
                    args: { metrics: 'sales' },
                    state: 'result',
                    result: {
                        title: 'Monthly Sales Data',
                        description: 'Sales performance over the last 6 months',
                        data: [
                            { name: 'Jan', value: 4000 },
                            { name: 'Feb', value: 3000 },
                            { name: 'Mar', value: 5000 },
                            { name: 'Apr', value: 2780 },
                            { name: 'May', value: 1890 },
                            { name: 'Jun', value: 2390 },
                        ]
                    }
                }
            }
        ]
    })

    console.log(`Successfully seeded chat ID: ${chatId}`)
}

seed().catch(console.error)
