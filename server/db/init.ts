import Database from 'better-sqlite3'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

const dataDir = join(process.cwd(), '.data', 'chat')
if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
}

const sqlite = new Database(join(dataDir, 'chat.db'))

sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

// Create chats table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT,
    session_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS chats_session_id_idx ON chats (session_id);
`)

// Create messages table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    parts TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages (chat_id);
`)

console.log('[Chat DB] Initialized successfully')
