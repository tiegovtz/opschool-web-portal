# Chat History and Memory Implementation Summary

## Overview
This document summarizes the implementation of chat history and memory system for the TIE AI Teacher. The system supports session-based conversations with context awareness.

**⚠️ IMPORTANT: Backend uses MongoDB!** The backend API stores data in MongoDB. PostgreSQL is only used for optional frontend local caching.

## Implementation Status

### ✅ Completed Components

#### 1. TypeScript Interfaces
- **File**: `app/types/chat.interface.ts`
- **Interfaces**: `ChatSession`, `ChatMessage`, `ChatContext`, `CreateSessionRequest`, `AddMessageRequest`

#### 2. API Endpoints Configuration
- **File**: `app/utilities/apiDocs.ts`
- **Added**: Chat API endpoints following existing pattern
  - `createSession`, `getSessions`, `getSession`, `updateSession`, `deleteSession`
  - `addMessage`, `getMessages`

#### 3. Composable for Chat History
- **File**: `app/composable/useChatHistory.ts`
- **Functions**: All CRUD operations for sessions and messages
- **Features**: Authentication handling, error management

#### 4. Pinia Store
- **File**: `app/stores/chatStore.ts`
- **Features**:
  - Active session management
  - Session list management
  - Message persistence
  - Local message caching

#### 5. Server API Routes (Nuxt Proxy)
- **Files**:
  - `server/api/chat/sessions.ts` - List and create sessions
  - `server/api/chat/sessions/[id].ts` - Individual session operations
  - `server/api/chat/sessions/[id]/messages.ts` - Message operations
- **Features**: Proxy to external API with authentication

#### 6. Updated Chat Page
- **File**: `app/pages/tie-ai-teacher/index.vue`
- **Features**:
  - Automatic session creation on page load
  - Message persistence to sessions
  - Session loading from query params
  - Integration with Chat component from @ai-sdk/vue

#### 7. Updated Chat Endpoint
- **File**: `server/api/chat.ts`
- **Added**: Support for `sessionId` header for session context

#### 8. Database Schema
- **Backend (MongoDB)**:
  - `database/mongodb_schema.md` - **MongoDB schema for backend API** ⭐
  - Collections: `chat_sessions`, `chat_messages`
  - Includes indexes, queries, and setup scripts
- **Frontend (PostgreSQL - Optional)**:
  - `database/migrations/001_create_chat_tables.sql` - SQL migration for local caching
  - `database/README.md` - PostgreSQL schema documentation
  - Only used if implementing local frontend caching

#### 9. PostgreSQL Connection Utility (Optional - Frontend Only)
- **File**: `server/utils/db.ts`
- **Features**: Connection management, query helpers, error handling
- **Note**: Only needed if implementing local frontend caching. Backend uses MongoDB.

#### 10. Retention Policy
- **Files**:
  - `server/utils/chatRetention.ts` - Retention logic
  - `server/api/chat/retention/enforce.ts` - Retention endpoint
- **Features**: Keep only most recent N sessions per user (default: 50)

## Backend API Requirements

**📋 IMPORTANT: See `API_CHAT_HISTORY_SPEC.md` for complete, detailed API specifications.**

The backend developer should refer to `API_CHAT_HISTORY_SPEC.md` which includes:
- ✅ Complete endpoint specifications with request/response examples
- ✅ Detailed data models and validation rules
- ✅ Authentication requirements
- ✅ Error response formats
- ✅ Implementation notes and best practices
- ✅ Testing checklist
- ✅ Database schema reference

### Quick Reference - Endpoints to Implement:

1. **POST `/chat/sessions`** - Create session
2. **GET `/chat/sessions`** - List user's sessions
3. **GET `/chat/sessions/:id`** - Get session with messages
4. **PUT `/chat/sessions/:id`** - Update session
5. **DELETE `/chat/sessions/:id`** - Delete session
6. **POST `/chat/sessions/:id/messages`** - Add message
7. **GET `/chat/sessions/:id/messages`** - Get messages (paginated)
8. **POST `/chat/sessions/retention/enforce`** - Retention policy (optional)

## Database Setup

**⚠️ IMPORTANT: Backend uses MongoDB, not PostgreSQL!**

To set up the MongoDB collections and indexes:

1. **Read the MongoDB schema**: `database/mongodb_schema.md`
2. **Run the setup script** provided in `database/mongodb_schema.md` to create indexes
3. Collections will be created automatically when first document is inserted

The frontend PostgreSQL setup is optional and only for local caching.

## Environment Variables

**Note**: The backend uses MongoDB. These PostgreSQL variables are only for optional local frontend caching.

```env
# Chat Retention Policy (for backend API)
CHAT_SESSION_LIMIT=50  # Maximum sessions per user

# Optional: Local PostgreSQL caching (frontend only)
DATABASE_URL=postgresql://user:password@localhost:5432/tie_portal
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tie_portal
```

## Usage Examples

### Creating a Session
```typescript
const chatStore = useChatStore();
const session = await chatStore.createSession({
  chapterName: "Introduction to Algebra",
  subject: "Mathematics",
  level: "Form 1"
});
```

### Loading a Session
```typescript
await chatStore.loadSession(sessionId);
const messages = chatStore.sessionMessages;
```

### Adding Messages
Messages are automatically saved when sent through the chat interface. The store handles persistence.

### Listing Sessions
```typescript
await chatStore.loadSessions();
const sessions = chatStore.sessions; // Sorted by most recent first
```

## Data Flow

1. **User sends message** → Frontend saves to store → Chat component sends to API
2. **API streams response** → Frontend receives → Saves assistant message to store
3. **Store syncs** → Calls external API to persist in **MongoDB** → Updates local cache (if enabled)

**Backend Storage**: All data is persisted in MongoDB via the external API endpoints.

## Next Steps

1. **Backend API Implementation**: Implement the required endpoints in the external API
2. **Testing**: Test session creation, message persistence, and retention policy
3. **UI Enhancements**: Add UI for:
   - Session list/sidebar
   - Session switching
   - Session deletion
   - Session title editing
4. **Offline Support**: Implement local cache sync when connection is restored
5. **Performance**: Add pagination for messages in long conversations

## Notes

- **⚠️ Backend uses MongoDB** - See `database/mongodb_schema.md` for complete MongoDB schema, indexes, and queries
- The frontend implementation is complete and ready to use once the backend API endpoints are implemented
- **Backend must use MongoDB `ObjectId` for all IDs** (convert to string when returning in JSON responses)
- Local PostgreSQL caching (frontend) is optional and completely separate from backend MongoDB
- Retention policy is enforced via the external API (MongoDB)
- All messages are stored with proper sequencing and metadata for context preservation
- The SQL migration file (`database/migrations/001_create_chat_tables.sql`) is **NOT needed for backend** - it's only for optional frontend local caching
