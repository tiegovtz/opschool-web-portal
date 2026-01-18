# Database Schema Documentation

## ⚠️ IMPORTANT: Backend Uses MongoDB!

**This PostgreSQL schema is for frontend local caching only.**

For the **backend API implementation**, see: **`database/mongodb_schema.md`** ⭐

The backend uses MongoDB, not PostgreSQL. The MongoDB schema document contains:
- Complete MongoDB collection schemas
- Index definitions
- Example queries
- Setup scripts

---

## PostgreSQL Schema (Frontend Local Caching Only)

### Overview
This PostgreSQL schema is optional and only used for local frontend caching. The primary storage is MongoDB in the backend API.

### Tables

#### `chat_sessions`
Stores conversation session metadata.

**Columns:**
- `id` (VARCHAR(255), PRIMARY KEY): Unique session identifier (UUID or CUID)
- `user_id` (VARCHAR(255), NOT NULL): Reference to user._id from auth system
- `title` (VARCHAR(500)): Auto-generated or user-provided session title
- `context_type` (VARCHAR(50), DEFAULT 'general'): Either 'general' or 'chapter'
- `chapter_name` (VARCHAR(255)): Chapter/competence name (if context_type = 'chapter')
- `subject` (VARCHAR(255)): Subject name (optional context)
- `level` (VARCHAR(255)): Education level (optional context)
- `topic` (VARCHAR(255)): Topic name (optional context)
- `chapter_no` (INTEGER): Chapter number (optional context)
- `message_count` (INTEGER, DEFAULT 0): Cached count for quick queries
- `last_message_at` (TIMESTAMP): Last activity timestamp
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Session creation time
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Last update time
- `deleted_at` (TIMESTAMP): Soft delete timestamp

**Indexes:**
- `idx_chat_sessions_user_id`: For querying user's sessions
- `idx_chat_sessions_user_created`: For sorting user sessions by creation date
- `idx_chat_sessions_context`: For querying sessions by context
- `idx_chat_sessions_deleted_at`: For filtering active sessions

#### `chat_messages`
Stores individual messages within sessions.

**Columns:**
- `id` (VARCHAR(255), PRIMARY KEY): Unique message identifier
- `session_id` (VARCHAR(255), NOT NULL): Foreign key to chat_sessions.id
- `role` (VARCHAR(20), NOT NULL): Message role ('user', 'assistant', or 'system')
- `content` (TEXT, NOT NULL): Message text content
- `parts` (JSONB): Full message parts array (for UIMessage format from @ai-sdk/vue)
- `metadata` (JSONB): Additional metadata (tokens, model, etc.)
- `sequence_order` (INTEGER, NOT NULL): Order within session (0-based)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Message creation time

**Indexes:**
- `idx_chat_messages_session_id`: For querying messages by session
- `idx_chat_messages_session_sequence`: For ordering messages within a session
- `idx_chat_messages_created_at`: For time-based queries

**Foreign Key:**
- `fk_chat_messages_session`: CASCADE DELETE - deleting a session deletes all its messages

### Triggers

1. **update_chat_sessions_updated_at**: Automatically updates `updated_at` when a session is modified
2. **update_chat_sessions_stats**: Updates `message_count` and `last_message_at` when a new message is added
3. **update_chat_sessions_stats_on_delete**: Updates `message_count` when a message is deleted

### Usage Examples

#### Create a new session
```sql
INSERT INTO chat_sessions (id, user_id, context_type, chapter_name, subject)
VALUES ('session-123', 'user-456', 'chapter', 'Introduction to Algebra', 'Mathematics');
```

#### Add a message to a session
```sql
INSERT INTO chat_messages (id, session_id, role, content, sequence_order)
VALUES ('msg-789', 'session-123', 'user', 'What is algebra?', 0);
```

#### Get session with messages
```sql
SELECT s.*, 
       json_agg(m ORDER BY m.sequence_order) as messages
FROM chat_sessions s
LEFT JOIN chat_messages m ON s.id = m.session_id
WHERE s.id = 'session-123' AND s.deleted_at IS NULL
GROUP BY s.id;
```

#### Get user's recent sessions
```sql
SELECT * FROM chat_sessions
WHERE user_id = 'user-456' 
  AND deleted_at IS NULL
ORDER BY last_message_at DESC
LIMIT 50;
```

### Retention Policy

The retention policy should be implemented at the application level:
- Keep only the most recent N sessions per user (default: 50)
- Auto-delete older sessions when limit is exceeded
- Soft delete is used (deleted_at timestamp) for potential recovery

### Migration

Run the migration file to create the tables:
```bash
psql -d your_database -f database/migrations/001_create_chat_tables.sql
```
