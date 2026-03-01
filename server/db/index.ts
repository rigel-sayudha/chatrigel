import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

const dataDir = join(process.cwd(), '.data', 'chat')
if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
}

const sqlite = new Database(join(dataDir, 'chat.db'))

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
export { schema }
