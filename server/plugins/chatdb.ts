import { db, schema } from '../db'
import { sql } from 'drizzle-orm'

export default defineNitroPlugin(async () => {
    // Run migrations on server startup
    const db_instance = db

    // Create chats table
    db_instance.run(sql`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT,
      session_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)

    db_instance.run(sql`
    CREATE INDEX IF NOT EXISTS chats_session_id_idx ON chats (session_id)
  `)

    // Create messages table
    db_instance.run(sql`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      parts TEXT,
      created_at INTEGER NOT NULL
    )
  `)

    db_instance.run(sql`
    CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages (chat_id)
  `)

    console.log('[Chat DB] Database tables initialized')
})
