import { tool } from 'ai'
import { z } from 'zod'

export const weatherTool = tool({
    description: 'Get weather info with 5-day forecast. Always use this tool when the user asks about the weather.',
    inputSchema: z.object({ location: z.string().describe('Location for weather') }),
    execute: async ({ location }) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        const temp = Math.floor(Math.random() * 35) + 5
        const conds = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Foggy']
        const condition = conds[Math.floor(Math.random() * conds.length)]

        return {
            location,
            temperature: Math.round(temp),
            condition,
            humidity: Math.floor(Math.random() * 60) + 20,
            windSpeed: Math.floor(Math.random() * 25) + 5,
            forecast: ['Tomorrow', 'Day 3', 'Day 4', 'Day 5'].map(day => ({
                day,
                high: Math.round(temp + Math.random() * 8 + 2),
                low: Math.round(temp - Math.random() * 8 - 2),
                condition: conds[Math.floor(Math.random() * conds.length)]
            }))
        }
    }
})
