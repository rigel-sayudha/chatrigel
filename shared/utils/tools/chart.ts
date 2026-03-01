import { tool } from 'ai'
import { z } from 'zod'

export const chartTool = tool({
    description: 'Show a bar chart of monthly sales data. Use this tool when the user asks for a chart or sales data.',
    inputSchema: z.object({}),
    execute: async () => {
        await new Promise(resolve => setTimeout(resolve, 1500))

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        const data = months.map(month => ({
            month,
            sales: Math.floor(Math.random() * 5000) + 1000,
            expenses: Math.floor(Math.random() * 3000) + 500
        }))

        return {
            title: 'Monthly Sales & Expenses',
            data
        }
    }
})
