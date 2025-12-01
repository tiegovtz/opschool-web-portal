<!-- b5d64d03-72c7-42a5-b715-2bcb3b5191ed 4868f8c3-c100-43a2-a5e7-8cb5b29881d8 -->
# Backend Migration Plan for Madam Ana

## Overview

Move frontend logic to backend endpoints to improve security, maintainability, enable AI-powered features (OpenAI TTS, Whisper), and centralize business logic. This will also enable conversation persistence and progress-aware responses.

## Migration Tasks

### Phase 1: Text Processing & TTS Endpoints

**1.1 Create Text Extraction Endpoint**

- **New File**: `server/api/ai-assistant/extract-text.ts`
- **Purpose**: Centralize text extraction logic used by both TTS and AI responses
- **Features**:
  - Extract plain text from HTML chapter content
  - Reuse existing `extractTextContent` function from `ask.ts`
  - Accept chapterId, return extracted text
  - Handle authentication via cookies

**1.2 Create TTS Endpoint**

- **New File**: `server/api/ai-assistant/tts.ts`
- **Purpose**: Use OpenAI TTS API for better quality voice responses
- **Features**:
  - Accept chapterId or text content
  - Use OpenAI TTS API with multiple voice options
  - Support Swahili-compatible voices
  - Return audio stream or URL
  - Fallback to extracted chapter text if no text provided

**1.3 Update Frontend TTS Handler**

- **File**: `app/components/chapter/AIAssistant.vue`
- **Changes**:
  - Remove `extractTextContent` function (duplicated logic)
  - Update `handleRead()` to call backend TTS endpoint
  - Keep browser TTS as optional fallback
  - Add toggle between OpenAI TTS and browser TTS

### Phase 2: Conversation Persistence

**2.1 Create Conversation Storage Endpoints**

- **New File**: `server/api/ai-assistant/conversations.ts`
- **Endpoints**:
  - `POST /api/ai-assistant/conversations` - Save conversation
  - `GET /api/ai-assistant/conversations/:chapterId` - Retrieve conversation
  - `DELETE /api/ai-assistant/conversations/:chapterId` - Clear conversation
- **Features**:
  - Store conversations per user per chapter
  - Save message history with timestamps
  - Retrieve and restore previous conversations
  - Search/filter conversations

**2.2 Update Frontend to Use Conversation Persistence**

- **File**: `app/components/chapter/AIAssistant.vue`
- **Changes**:
  - Load saved conversation on component mount
  - Auto-save conversation after each exchange
  - Add "Load Previous Conversation" button
  - Add "Clear Conversation" option

### Phase 3: Progress Integration

**3.1 Fetch Progress in AI Endpoint**

- **File**: `server/api/ai-assistant/ask.ts`
- **Changes**:
  - Fetch student progress from `/api/progress` endpoint before generating prompt
  - Extract quiz scores, notesProgress, videoProgress
  - Include progress data in system prompt
  - Adjust response complexity based on performance

**3.2 Enhance System Prompt with Progress**

- **File**: `server/api/ai-assistant/ask.ts`
- **Changes**:
  - Add progress context to system prompt
  - Reference quiz scores to identify weak areas
  - Skip explanations for mastered concepts (quiz score >80%)
  - Suggest review for low-performing areas

### Phase 4: Voice Input (Future)

**4.1 Create Transcription Endpoint**

- **New File**: `server/api/ai-assistant/transcribe.ts`
- **Purpose**: Use OpenAI Whisper API for speech-to-text
- **Features**:
  - Accept audio file (WebM, MP3, etc.)
  - Use OpenAI Whisper API for transcription
  - Support Swahili and English
  - Return transcribed text
  - Handle authentication

**4.2 Add Voice Input UI**

- **File**: `app/components/chapter/AIAssistant.vue`
- **Changes**:
  - Add microphone button
  - Record audio using MediaRecorder API
  - Send audio to transcription endpoint
  - Display transcribed text in input field

## Implementation Details

### Text Extraction Endpoint Structure

```
POST /api/ai-assistant/extract-text
Body: { chapterId: string }
Response: { text: string, chapterName: string }
```

### TTS Endpoint Structure

```
POST /api/ai-assistant/tts
Body: { 
  chapterId?: string, 
  text?: string,
  voice?: string,  // 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
  language?: string  // 'en' or 'sw'
}
Response: { audioUrl: string } or stream audio directly
```

### Conversation Endpoints Structure

```
POST /api/ai-assistant/conversations
Body: { chapterId: string, messages: Array<{role, content, timestamp}> }

GET /api/ai-assistant/conversations/:chapterId
Response: { messages: Array, createdAt: string, updatedAt: string }

DELETE /api/ai-assistant/conversations/:chapterId
Response: { success: boolean }
```

## Benefits

1. **Security**: API keys (OpenAI, etc.) stay on server
2. **Performance**: Reduced frontend bundle size
3. **Consistency**: Single source of truth for text extraction
4. **Quality**: Better TTS with OpenAI API (supports Swahili)
5. **Persistence**: Conversations saved across sessions
6. **Personalization**: Progress-aware responses
7. **Maintainability**: Centralized business logic

## Database Considerations

For conversation persistence, consider:

- Using existing database (if available)
- Or simple file-based storage per user/chapter
- Or session storage with optional DB backup

## Migration Order

1. **Phase 1.1** - Text extraction endpoint (quick, no dependencies)
2. **Phase 1.2** - TTS endpoint (enables better voice quality)
3. **Phase 1.3** - Update frontend to use new endpoints
4. **Phase 3.1-3.2** - Progress integration (enhances AI responses)
5. **Phase 2** - Conversation persistence (adds value, less critical)
6. **Phase 4** - Voice input (future enhancement)

## Testing Strategy

1. Test text extraction endpoint independently
2. Test TTS endpoint with sample text
3. Verify frontend still works with new endpoints
4. Test conversation persistence (save/load/delete)
5. Verify progress integration affects AI responses
6. Test error handling and fallbacks

### To-dos

- [ ] Create AIAssistant.vue component with floating button, chat interface, and message handling
- [ ] Integrate AIAssistant component into chapter page (app/pages/interactive/[subject]/[level]/[topic]/[topicId].vue)
- [ ] Test AI assistant functionality: question answering, scope enforcement, error handling