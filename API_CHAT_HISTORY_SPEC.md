# Chat History API Specification

## Overview
This document provides detailed API specifications for implementing chat history and memory endpoints in the backend API. The frontend is already implemented and ready to consume these endpoints.

## Base URL
All endpoints are under: `https://apitie.ekima.africa/v1/chat`

## Authentication
All endpoints require authentication via Bearer token in the `Authorization` header:
```
Authorization: Bearer {access_token}
```

The token is obtained from the existing auth system (`/auth/login`).

## Data Models

### ChatSession
```typescript
{
  id: string;                    // MongoDB ObjectId as string (primary key)
  userId: string;               // References user._id from auth system
  title?: string;                // Auto-generated or user-provided title
  contextType: 'general' | 'chapter';
  chapterName?: string;          // Chapter/competence name
  subject?: string;              // Subject name
  level?: string;                // Education level
  topic?: string;                // Topic name
  chapterNo?: number;            // Chapter number
  messageCount: number;          // Cached count (auto-updated)
  lastMessageAt?: string;        // ISO 8601 timestamp
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
  deletedAt?: string;           // ISO 8601 timestamp (soft delete)
}
```

### ChatMessage
```typescript
{
  id: string;                    // MongoDB ObjectId as string (primary key)
  sessionId: string;             // MongoDB ObjectId as string (references chat_sessions._id)
  role: 'user' | 'assistant' | 'system';
  content: string;               // Message text content
  parts?: any[];                 // Full message parts array (for UIMessage format)
  metadata?: Record<string, any>; // Additional metadata (tokens, model, etc.)
  sequenceOrder: number;         // Order within session (0-based)
  createdAt: string;             // ISO 8601 timestamp
}
```

---

## API Endpoints

### 1. Create Session
**POST** `/chat/sessions`

Creates a new chat session for the authenticated user.

**Request Body:**
```json
{
  "title": "Optional session title",
  "contextType": "general",  // or "chapter"
  "chapterName": "Introduction to Algebra",  // optional
  "subject": "Mathematics",   // optional
  "level": "Form 1",         // optional
  "topic": "Algebra Basics",  // optional
  "chapterNo": 1             // optional
}
```

**Response:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439011",  // MongoDB ObjectId
  "userId": "user-xyz789",
  "title": "New Conversation",
  "contextType": "general",
  "messageCount": 0,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Validation:**
- `contextType` must be either "general" or "chapter"
- If `contextType` is "chapter", `chapterName` should be provided
- `userId` is automatically set from the authenticated user

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 2. Get All Sessions
**GET** `/chat/sessions`

Retrieves all chat sessions for the authenticated user.

**Query Parameters:** None

**Response:** `200 OK`
```json
[
  {
    "id": "507f1f77bcf86cd799439011",  // MongoDB ObjectId
    "userId": "user-xyz789",
    "title": "Math Questions",
    "contextType": "chapter",
    "chapterName": "Introduction to Algebra",
    "subject": "Mathematics",
    "messageCount": 15,
    "lastMessageAt": "2024-01-15T14:20:00Z",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:20:00Z"
  },
  {
    "id": "507f1f77bcf86cd799439022",  // MongoDB ObjectId
    "userId": "user-xyz789",
    "title": "General Questions",
    "contextType": "general",
    "messageCount": 8,
    "lastMessageAt": "2024-01-14T16:45:00Z",
    "createdAt": "2024-01-14T09:00:00Z",
    "updatedAt": "2024-01-14T16:45:00Z"
  }
]
```

**Sorting:** Sessions should be sorted by `lastMessageAt DESC` (most recent first), with sessions that have no messages sorted by `createdAt DESC`.

**Filtering:** Only return sessions where `deletedAt IS NULL`.

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### 3. Get Session by ID
**GET** `/chat/sessions/:id`

Retrieves a specific session with its messages.

**Path Parameters:**
- `id` (string, required) - Session ID

**Response:** `200 OK`
```json
{
  "id": "session-abc123",
  "userId": "user-xyz789",
  "title": "Math Questions",
  "contextType": "chapter",
  "chapterName": "Introduction to Algebra",
  "subject": "Mathematics",
  "level": "Form 1",
  "messageCount": 15,
  "lastMessageAt": "2024-01-15T14:20:00Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T14:20:00Z",
  "messages": [
    {
      "id": "507f1f77bcf86cd799439012",  // MongoDB ObjectId
      "sessionId": "507f1f77bcf86cd799439011",  // MongoDB ObjectId
      "role": "user",
      "content": "What is algebra?",
      "sequenceOrder": 0,
      "createdAt": "2024-01-15T10:31:00Z"
    },
    {
      "id": "507f1f77bcf86cd799439013",  // MongoDB ObjectId
      "sessionId": "507f1f77bcf86cd799439011",  // MongoDB ObjectId
      "role": "assistant",
      "content": "Algebra is a branch of mathematics...",
      "sequenceOrder": 1,
      "createdAt": "2024-01-15T10:31:15Z"
    }
  ]
}
```

**Notes:**
- Messages should be ordered by `sequenceOrder ASC`
- Only return session if `deletedAt IS NULL`
- Only return session if it belongs to the authenticated user

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Session not found or doesn't belong to user
- `500 Internal Server Error` - Server error

---

### 4. Update Session
**PUT** `/chat/sessions/:id`

Updates a session (primarily for updating the title).

**Path Parameters:**
- `id` (string, required) - Session ID

**Request Body:**
```json
{
  "title": "Updated Session Title"
}
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",  // MongoDB ObjectId
  "userId": "user-xyz789",
  "title": "Updated Session Title",
  "contextType": "chapter",
  "messageCount": 15,
  "updatedAt": "2024-01-15T15:00:00Z",
  ...
}
```

**Validation:**
- Only allow updating `title` field
- Session must belong to authenticated user
- Session must not be deleted (`deletedAt IS NULL`)

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Session not found or doesn't belong to user
- `500 Internal Server Error` - Server error

---

### 5. Delete Session
**DELETE** `/chat/sessions/:id`

Soft deletes a session (sets `deletedAt` timestamp).

**Path Parameters:**
- `id` (string, required) - Session ID

**Response:** `200 OK` or `204 No Content`
```json
{
  "success": true
}
```

**Notes:**
- Use soft delete (set `deletedAt` to current timestamp)
- Optionally cascade delete messages (or keep them for analytics)
- Session must belong to authenticated user

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Session not found or doesn't belong to user
- `500 Internal Server Error` - Server error

---

### 6. Add Message to Session
**POST** `/chat/sessions/:id/messages`

Adds a message to a session.

**Path Parameters:**
- `id` (string, required) - Session ID

**Request Body:**
```json
{
  "role": "user",  // or "assistant" or "system"
  "content": "What is algebra?",
  "parts": [       // optional, for UIMessage format
    {
      "type": "text",
      "text": "What is algebra?"
    }
  ],
  "metadata": {    // optional
    "tokens": 5,
    "model": "gpt-4o"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439014",  // MongoDB ObjectId
  "sessionId": "507f1f77bcf86cd799439011",  // MongoDB ObjectId
  "role": "user",
  "content": "What is algebra?",
  "parts": [...],
  "sequenceOrder": 2,
  "createdAt": "2024-01-15T15:30:00Z"
}
```

**Validation:**
- `role` must be "user", "assistant", or "system"
- `content` is required and must not be empty
- `sequenceOrder` should be auto-calculated (next available number)
- Session must belong to authenticated user
- Session must not be deleted

**Side Effects:**
- Update session's `messageCount` (increment by 1)
- Update session's `lastMessageAt` to current timestamp
- Update session's `updatedAt` to current timestamp

**Error Responses:**
- `400 Bad Request` - Invalid request body or missing required fields
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Session not found or doesn't belong to user
- `500 Internal Server Error` - Server error

---

### 7. Get Messages for Session
**GET** `/chat/sessions/:id/messages`

Retrieves messages for a session (paginated).

**Path Parameters:**
- `id` (string, required) - Session ID

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 50, max: 100)

**Response:** `200 OK`
```json
[
  {
    "id": "507f1f77bcf86cd799439012",  // MongoDB ObjectId
    "sessionId": "507f1f77bcf86cd799439011",  // MongoDB ObjectId
    "role": "user",
    "content": "What is algebra?",
    "sequenceOrder": 0,
    "createdAt": "2024-01-15T10:31:00Z"
  },
  {
    "id": "507f1f77bcf86cd799439013",  // MongoDB ObjectId
    "sessionId": "507f1f77bcf86cd799439011",  // MongoDB ObjectId
    "role": "assistant",
    "content": "Algebra is...",
    "sequenceOrder": 1,
    "createdAt": "2024-01-15T10:31:15Z"
  }
]
```

**Notes:**
- Messages should be ordered by `sequenceOrder ASC`
- Only return messages if session belongs to authenticated user
- Only return messages if session is not deleted

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Session not found or doesn't belong to user
- `500 Internal Server Error` - Server error

---

### 8. Enforce Retention Policy (Optional)
**POST** `/chat/sessions/retention/enforce`

Enforces retention policy by deleting old sessions beyond the limit.

**Request Body:**
```json
{
  "userId": "user-xyz789",
  "maxSessions": 50
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "deletedCount": 5,
  "maxSessions": 50
}
```

**Logic:**
1. Get all non-deleted sessions for the user
2. Sort by `lastMessageAt DESC` (sessions with no messages by `createdAt DESC`)
3. Keep the most recent `maxSessions` sessions
4. Soft delete (set `deletedAt`) all sessions beyond the limit
5. Return count of deleted sessions

**Error Responses:**
- `400 Bad Request` - Missing userId
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

## Database Schema

**IMPORTANT: Backend uses MongoDB, not PostgreSQL!**

See `database/mongodb_schema.md` for the complete MongoDB schema.

**Key Points:**
- Use MongoDB `ObjectId` for `_id` fields (auto-generated)
- Use `Date` objects for all timestamp fields
- Use `Array` for `parts` field in messages
- Use `Object` for `metadata` field in messages
- Implement soft deletes with `deletedAt` field (set to `null` for active sessions)
- Use MongoDB indexes for performance (see schema doc for index definitions)
- Auto-update `messageCount` and `lastMessageAt` via application logic when messages are added
- Reference `sessionId` in messages as `ObjectId` pointing to `chat_sessions._id`

---

## Implementation Notes

### Auto-generating Session Titles
When a session is created without a title, you can:
1. Generate from first user message (e.g., first 50 chars)
2. Use context info: "Math - Introduction to Algebra"
3. Use default: "New Conversation"

### Sequence Order
- Start at 0 for the first message
- Increment by 1 for each subsequent message
- Ensure no gaps (use `MAX(sequenceOrder) + 1` when inserting new messages)
- Query: `db.chat_messages.find({ sessionId: ... }).sort({ sequenceOrder: 1 })`

### Timestamps
- Use ISO 8601 format: `2024-01-15T10:30:00Z`
- Store in UTC
- Auto-set `created_at` and `updated_at`

### Error Handling
Always return consistent error format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Performance Considerations
- Create compound index: `{ userId: 1, deletedAt: 1, lastMessageAt: -1 }` for fast session queries
- Create compound index: `{ sessionId: 1, sequenceOrder: 1 }` for fast message queries
- Consider pagination for messages in long conversations
- Cache `messageCount` in session document to avoid COUNT queries
- Use MongoDB aggregation pipeline for complex queries if needed

---

## Testing Checklist

- [ ] Create session (general)
- [ ] Create session (chapter context)
- [ ] Get all sessions (sorted correctly)
- [ ] Get session by ID (with messages)
- [ ] Update session title
- [ ] Delete session (soft delete)
- [ ] Add user message
- [ ] Add assistant message
- [ ] Get messages (paginated)
- [ ] Enforce retention policy
- [ ] Authentication required for all endpoints
- [ ] User can only access their own sessions
- [ ] Soft-deleted sessions are excluded
- [ ] Sequence order is maintained
- [ ] Session stats are updated correctly

---

## Questions?

If you need clarification on any endpoint or data model, please refer to:
- Frontend implementation: `app/composable/useChatHistory.ts`
- Type definitions: `app/types/chat.interface.ts`
- **MongoDB schema**: `database/mongodb_schema.md` ⭐ (IMPORTANT - Backend uses MongoDB!)
