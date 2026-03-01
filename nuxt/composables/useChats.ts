import { format, isToday, isYesterday, isThisWeek, isThisMonth, subDays } from 'date-fns'

interface ChatItem {
    id: string
    label: string
    to: string
    createdAt: string | Date
}

interface ChatGroup {
    label: string
    items: ChatItem[]
}

export function useChats(chats: Ref<ChatItem[] | null | undefined>) {
    const groups = computed<ChatGroup[]>(() => {
        if (!chats.value?.length) return []

        const groupMap = new Map<string, ChatItem[]>()

        for (const chat of chats.value) {
            const date = new Date(chat.createdAt)
            let groupLabel: string

            if (isToday(date)) {
                groupLabel = 'Today'
            } else if (isYesterday(date)) {
                groupLabel = 'Yesterday'
            } else if (isThisWeek(date)) {
                groupLabel = format(date, 'EEEE') // Day name
            } else if (isThisMonth(date)) {
                groupLabel = 'Earlier this month'
            } else {
                groupLabel = format(date, 'MMMM yyyy')
            }

            if (!groupMap.has(groupLabel)) {
                groupMap.set(groupLabel, [])
            }
            groupMap.get(groupLabel)!.push(chat)
        }

        return Array.from(groupMap.entries()).map(([label, items]) => ({
            label,
            items,
        }))
    })

    return { groups }
}
