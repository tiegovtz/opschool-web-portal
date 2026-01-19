# Chat History API - Backend Implementation Guide

## 🎯 What You Need to Do

Implement 8 API endpoints for chat history and memory functionality. The frontend is **already complete** and waiting for these endpoints.

## 📚 Documentation

**Start here:** Read `API_CHAT_HISTORY_SPEC.md` - This contains everything you need:
- Complete endpoint specifications
- Request/response examples
- Data models
- Validation rules
- Error handling
- **MongoDB schema reference** ⭐
- Testing checklist

## 🚀 Quick Start

1. **Read the spec**: `API_CHAT_HISTORY_SPEC.md`
2. **Check the MongoDB schema**: `database/mongodb_schema.md` ⭐ **IMPORTANT - Backend uses MongoDB!**
3. **Review data models**: `app/types/chat.interface.ts` (TypeScript, but shows the structure)

## 📋 Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/chat/sessions` | Create new session |
| GET | `/chat/sessions` | List user's sessions |
| GET | `/chat/sessions/:id` | Get session with messages |
| PUT | `/chat/sessions/:id` | Update session (title) |
| DELETE | `/chat/sessions/:id` | Delete session (soft delete) |
| POST | `/chat/sessions/:id/messages` | Add message to session |
| GET | `/chat/sessions/:id/messages` | Get messages (paginated) |
| POST | `/chat/sessions/retention/enforce` | Retention policy (optional) |

## 🔑 Key Requirements

1. **Authentication**: All endpoints require Bearer token (`Authorization: Bearer {token}`)
2. **User Isolation**: Users can only access their own sessions
3. **Soft Deletes**: Use `deletedAt` field (set to `null` for active sessions)
4. **Auto-updates**: Update `messageCount` and `lastMessageAt` when messages are added
5. **Sorting**: Sessions sorted by `lastMessageAt DESC` (most recent first)
6. **MongoDB**: Use MongoDB `ObjectId` for all IDs (not strings or UUIDs)

## 🗄️ Database

**⚠️ IMPORTANT: Backend uses MongoDB, not PostgreSQL!**

- **MongoDB Schema**: `database/mongodb_schema.md` ⭐
- **Collections**: `chat_sessions`, `chat_messages`
- Use MongoDB `ObjectId` for IDs
- See `database/mongodb_schema.md` for complete schema, indexes, and example queries
- The PostgreSQL files are only for optional frontend local caching

## ✅ Testing

Use the testing checklist in `API_CHAT_HISTORY_SPEC.md` to verify all endpoints work correctly.

## ❓ Questions?

- Check `API_CHAT_HISTORY_SPEC.md` for detailed specs
- Check `database/mongodb_schema.md` for MongoDB schema and queries ⭐
- Check `app/composable/useChatHistory.ts` to see how frontend calls the APIs
- Check `database/README.md` for PostgreSQL info (frontend only, not needed for backend)

## 📝 Notes

- The frontend is ready and will work once endpoints are implemented
- All endpoints should follow REST conventions
- Return consistent error formats
- Use ISO 8601 for timestamps
- Implement proper validation and error handling
- **Use MongoDB ObjectId for all IDs** - convert to string when returning in JSON

---

**Ready to start?** Open `API_CHAT_HISTORY_SPEC.md` and `database/mongodb_schema.md` and begin implementing! 🚀
