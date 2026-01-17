# MongoDB Schema for Chat History

## Overview
This document defines the MongoDB collections and schemas for the chat history and memory system.

## Collections

### 1. `chat_sessions` Collection

Stores conversation session metadata.

**Schema:**
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  userId: String,                   // References user._id from auth system (indexed)
  title: String,                    // Auto-generated or user-provided title
  contextType: String,             // 'general' or 'chapter' (default: 'general')
  chapterName: String,             // Chapter/competence name (optional)
  subject: String,                  // Subject name (optional)
  level: String,                     // Education level (optional)
  topic: String,                     // Topic name (optional)
  chapterNo: Number,                // Chapter number (optional)
  messageCount: Number,             // Cached count (default: 0)
  lastMessageAt: Date,              // Last activity timestamp
  createdAt: Date,                  // Session creation time
  updatedAt: Date,                  // Last update time
  deletedAt: Date                   // Soft delete timestamp (null if active)
}
```

**Indexes:**
```javascript
// Compound index for user sessions query (most important)
db.chat_sessions.createIndex({ userId: 1, deletedAt: 1, lastMessageAt: -1 })

// Index for context-based queries
db.chat_sessions.createIndex({ userId: 1, contextType: 1, chapterName: 1 })

// Index for user sessions by creation date
db.chat_sessions.createIndex({ userId: 1, createdAt: -1 })

// Index for soft delete filtering
db.chat_sessions.createIndex({ deletedAt: 1 })
```

**Example Document:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  userId: "user-xyz789",
  title: "Math Questions",
  contextType: "chapter",
  chapterName: "Introduction to Algebra",
  subject: "Mathematics",
  level: "Form 1",
  topic: "Algebra Basics",
  chapterNo: 1,
  messageCount: 15,
  lastMessageAt: ISODate("2024-01-15T14:20:00Z"),
  createdAt: ISODate("2024-01-15T10:30:00Z"),
  updatedAt: ISODate("2024-01-15T14:20:00Z"),
  deletedAt: null
}
```

---

### 2. `chat_messages` Collection

Stores individual messages within sessions.

**Schema:**
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  sessionId: ObjectId,              // References chat_sessions._id (indexed)
  role: String,                     // 'user', 'assistant', or 'system'
  content: String,                   // Message text content (required)
  parts: Array,                     // Full message parts array (optional, for UIMessage format)
  metadata: Object,                  // Additional metadata (optional)
  sequenceOrder: Number,            // Order within session (0-based, required)
  createdAt: Date                  // Message creation time
}
```

**Indexes:**
```javascript
// Compound index for session messages query (most important)
db.chat_messages.createIndex({ sessionId: 1, sequenceOrder: 1 })

// Index for session lookup
db.chat_messages.createIndex({ sessionId: 1 })

// Index for time-based queries
db.chat_messages.createIndex({ createdAt: 1 })
```

**Example Document:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  sessionId: ObjectId("507f1f77bcf86cd799439011"),
  role: "user",
  content: "What is algebra?",
  parts: [
    {
      type: "text",
      text: "What is algebra?"
    }
  ],
  metadata: {
    tokens: 5,
    model: "gpt-4o"
  },
  sequenceOrder: 0,
  createdAt: ISODate("2024-01-15T10:31:00Z")
}
```

---

## MongoDB Setup Script

```javascript
// Run this script in MongoDB shell or via your application

// Create chat_sessions collection with indexes
db.chat_sessions.createIndex({ userId: 1, deletedAt: 1, lastMessageAt: -1 });
db.chat_sessions.createIndex({ userId: 1, contextType: 1, chapterName: 1 });
db.chat_sessions.createIndex({ userId: 1, createdAt: -1 });
db.chat_sessions.createIndex({ deletedAt: 1 });

// Create chat_messages collection with indexes
db.chat_messages.createIndex({ sessionId: 1, sequenceOrder: 1 });
db.chat_messages.createIndex({ sessionId: 1 });
db.chat_messages.createIndex({ createdAt: 1 });

print("✅ Chat collections and indexes created successfully");
```

---

## Common Queries

### Get user's sessions (most recent first)
```javascript
db.chat_sessions.find({
  userId: "user-xyz789",
  deletedAt: null
}).sort({ lastMessageAt: -1, createdAt: -1 })
```

### Get session with messages
```javascript
// Get session
const session = db.chat_sessions.findOne({
  _id: ObjectId("507f1f77bcf86cd799439011"),
  deletedAt: null
});

// Get messages
const messages = db.chat_messages.find({
  sessionId: ObjectId("507f1f77bcf86cd799439011")
}).sort({ sequenceOrder: 1 }).toArray();
```

### Get messages for session (paginated)
```javascript
const page = 1;
const limit = 50;
const skip = (page - 1) * limit;

db.chat_messages.find({
  sessionId: ObjectId("507f1f77bcf86cd799439011")
})
.sort({ sequenceOrder: 1 })
.skip(skip)
.limit(limit)
.toArray();
```

### Update session stats when message is added
```javascript
// After inserting a message, update session
db.chat_sessions.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  {
    $inc: { messageCount: 1 },
    $set: { 
      lastMessageAt: new Date(),
      updatedAt: new Date()
    }
  }
);
```

### Enforce retention policy (keep most recent N sessions)
```javascript
function enforceRetention(userId, maxSessions) {
  // Get all sessions sorted by lastMessageAt
  const sessions = db.chat_sessions.find({
    userId: userId,
    deletedAt: null
  }).sort({ lastMessageAt: -1, createdAt: -1 }).toArray();
  
  if (sessions.length <= maxSessions) {
    return 0; // No deletion needed
  }
  
  // Get IDs of sessions to delete (beyond the limit)
  const sessionsToDelete = sessions.slice(maxSessions).map(s => s._id);
  
  // Soft delete old sessions
  const result = db.chat_sessions.updateMany(
    { _id: { $in: sessionsToDelete } },
    { $set: { deletedAt: new Date() } }
  );
  
  return result.modifiedCount;
}
```

---

## Data Type Notes

- **ObjectId**: Use MongoDB's `ObjectId` for `_id` fields
- **Date**: Use JavaScript `Date` objects or ISO 8601 strings (MongoDB will convert)
- **String**: Use for all text fields
- **Number**: Use for `chapterNo`, `messageCount`, `sequenceOrder`
- **Array**: Use for `parts` field (can contain objects)
- **Object**: Use for `metadata` field (can contain any key-value pairs)
- **null**: Use for `deletedAt` when session is active

---

## Validation Rules

### chat_sessions
- `userId` is required
- `contextType` must be either "general" or "chapter"
- `messageCount` defaults to 0
- `createdAt` and `updatedAt` should be set automatically
- `deletedAt` is null for active sessions

### chat_messages
- `sessionId` is required and must reference existing session
- `role` must be "user", "assistant", or "system"
- `content` is required and must not be empty
- `sequenceOrder` must be unique within a session (use `MAX(sequenceOrder) + 1` for new messages)
- `createdAt` should be set automatically

---

## Migration from SQL (if needed)

If you have existing PostgreSQL data, you'll need to:
1. Export data from PostgreSQL
2. Transform data types (especially IDs - PostgreSQL uses VARCHAR, MongoDB uses ObjectId)
3. Import into MongoDB collections
4. Create indexes as specified above

---

## Best Practices

1. **Use ObjectId references**: Store `sessionId` as ObjectId, not string
2. **Index strategically**: The compound index `{ userId: 1, deletedAt: 1, lastMessageAt: -1 }` is critical for performance
3. **Soft deletes**: Always check `deletedAt: null` in queries
4. **Auto-update timestamps**: Use application logic or middleware to set `createdAt` and `updatedAt`
5. **Atomic operations**: Use `$inc` and `$set` together when updating session stats
6. **Sequence order**: Calculate `sequenceOrder` as `MAX(sequenceOrder) + 1` for new messages
