# Conversation Practice Feature - Technical Documentation

## Overview

The Conversation Practice feature enables students to practice English conversations with an AI tutor. It supports both voice-based (speech-to-text/text-to-speech) and text-based interaction modes.

## Table of Contents

1. [Architecture](#architecture)
2. [Setup Guide](#setup-guide)
3. [Core Concepts](#core-concepts)
4. [API Reference](#api-reference)
5. [Configuration](#configuration)
6. [Extending the Feature](#extending-the-feature)
7. [Troubleshooting](#troubleshooting)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Vue.js)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Conversation    │  │ Audio Player    │  │ Speech          │ │
│  │ Display         │  │ & Controls      │  │ Recognition     │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                     │          │
│           └────────────────────┼─────────────────────┘          │
│                                │                                 │
│                    ┌───────────▼───────────┐                    │
│                    │   Pinia Store         │                    │
│                    │   (Compact State)     │                    │
│                    └───────────┬───────────┘                    │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Nuxt Server        │
                    │                         │
┌───────────────────┤  ┌─────────────────┐   ├───────────────────┐
│                   │  │   API Routes    │   │                   │
│  ┌────────────┐   │  │                 │   │  ┌────────────┐   │
│  │ TTS        │◄──┼──┤ /api/convo/tts │   │  │ OpenAI     │   │
│  │ Supertonic │   │  │                 │   │  │ GPT-4o-mini│   │
│  └────────────┘   │  │ /api/convo/    │───┼──►            │   │
│                   │  │ validate        │   │  └────────────┘   │
│                   │  │                 │   │                   │
│                   │  │ /api/convo/    │───┼──►                 │
│                   │  │ detect-voice    │   │                   │
│                   │  └─────────────────┘   │                   │
│                   └────────────────────────┘                   │
│                                                                 │
│  External Services                                              │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
tie-web-portal/
├── app/
│   ├── pages/
│   │   └── conversation-practice/
│   │       └── index.vue              # Main conversation UI
│   ├── stores/
│   │   └── conversation.ts            # Pinia store for state management
│   └── types/
│       └── conversation.interface.ts  # TypeScript interfaces
├── server/
│   ├── api/
│   │   └── conversation/
│   │       ├── tts.ts                 # Text-to-Speech generation
│   │       ├── validate.ts            # Answer validation & adaptation
│   │       └── detect-voice.ts        # Speaker gender detection
│   ├── config/
│   │   ├── conversation-profiles.ts   # Profile definitions & loader
│   │   └── profiles/
│   │       ├── form1-introduction.json
│   │       └── health-scenario.json
│   └── prompts/
│       ├── compose.ts                 # Prompt assembly
│       └── validation/
│           ├── base.ts                # Base prompt templates
│           └── rules.ts               # Validation rule templates
└── CONVERSATION_PRACTICE_DOCS.md      # This file
```

---

## Setup Guide

### Prerequisites

1. **Node.js** (v18+) and **pnpm**
2. **Git LFS** (for Supertonic assets)
3. **OpenAI API key** (for validation)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/tie-web-portal.git
cd tie-web-portal

# Install dependencies
pnpm install
```

### Step 2: Set Up Supertonic TTS

Supertonic is a local text-to-speech engine:

```bash
# 1. Install Git LFS (if not already installed)
# macOS
brew install git-lfs

# Ubuntu/Debian
sudo apt-get install git-lfs

# Initialize Git LFS
git lfs install

# 2. Clone the Supertonic repository
git clone https://github.com/supertone-inc/supertonic.git ~/supertonic

# 3. Download voice assets from Hugging Face
git clone https://huggingface.co/Supertone/supertonic ~/supertonic/assets

# 4. Install Node.js dependencies for Supertonic
cd ~/supertonic/nodejs
npm install
```

### Step 3: Configure Environment Variables

Create or update `.env` in the project root:

```bash
# Supertonic TTS Configuration
SUPERTONIC_NODEJS=/Users/yourusername/supertonic/nodejs
SUPERTONIC_ASSETS=/Users/yourusername/supertonic/assets

# TTS Quality Settings
TTS_SPEED=0.75                    # Generation speed (0.5-1.5)
TTS_STEPS_SHORT=10                # Steps for short sentences
TTS_STEPS_DEFAULT=6               # Steps for regular chunks
TTS_DEFAULT_VOICE_FEMALE=F4       # Default female voice (F1-F5)
TTS_DEFAULT_VOICE_MALE=M4         # Default male voice (M1-M5)

# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
```

### Step 4: Run the Application

```bash
pnpm dev
```

Access the conversation practice page at: `http://localhost:3000/conversation-practice`

Add `?debug=1` to the URL to see the compact state in the UI.

---

## Core Concepts

### Compact Conversation State

Instead of sending full conversation history to OpenAI on every validation (expensive!), we maintain a compact state object:

```typescript
interface ConversationState {
  // AI Character Identity
  aiName: string | null           // e.g., "Anna", "Michael"
  aiGender: 'male' | 'female'
  aiRole: string | null           // e.g., "Form 1 student"
  
  // User Context
  userName: string | null         // Extracted when user introduces themselves
  userMood: 'positive' | 'negative' | 'neutral'
  
  // Conversation Memory
  userChoices: Record<string, string>  // e.g., { destination: "clinic" }
  keyFacts: string[]              // e.g., ["user is 18 years old"]
  
  // Progress
  questionIndex: number
  totalQuestions: number
  lastCorrectAnswer: string | null
}
```

**Benefits:**
- **Cost reduction**: Smaller prompts = fewer tokens = lower OpenAI costs
- **Context coherence**: Explicit tracking of choices prevents contradictions
- **Performance**: Faster validation with less data
- **Debugging**: Clear state object easy to inspect

### Conversation Profiles

Profiles allow customizing validation behavior for different scenarios:

```typescript
interface ConversationProfile {
  id: string
  name: string
  targetLevel: 'form1' | 'form2' | 'form3' | 'form4' | 'advanced'
  
  validation: {
    strictness: 'lenient' | 'moderate' | 'strict'
    requireDialogueStructure: boolean
    allowHumor: boolean
    contextualMemoryEnabled: boolean
  }
  
  adaptation: {
    emotionalResponses: boolean
    comparativeResponses: boolean
    nameAcknowledgment: boolean
  }
  
  voice: {
    defaultGender: 'male' | 'female'
    speed: number
  }
}
```

### State Extraction

The backend automatically extracts facts from user answers:

- **User name**: From "I am [Name]" or "My name is [Name]"
- **User age**: From "I am [number]" or "[number] years old"
- **User mood**: From emotional keywords (happy, sad, etc.)
- **User choices**: From choice questions (pharmacy vs clinic)
- **Key facts**: Subject preferences, living situation, etc.

---

## API Reference

### POST `/api/conversation/tts`

Generates audio from text using Supertonic TTS.

**Request:**
```json
{
  "text": "Hello, how are you?",
  "voiceType": "female",
  "voiceId": "F4"
}
```

**Response:**
```json
{
  "success": true,
  "audioUrl": "/temp-audio/conversation-123456-abc123.wav",
  "metrics": {
    "inputLength": 19,
    "numChunks": 1,
    "totalTimeMs": 850,
    "voiceId": "F4"
  }
}
```

### POST `/api/conversation/validate`

Validates user answers and generates adapted responses.

**Request:**
```json
{
  "conversationContext": ["What's your name?", "Nice to meet you!"],
  "currentPiece": "What's your name?",
  "currentIndex": 0,
  "userAnswer": "I am Michael",
  "conversationState": {
    "aiName": null,
    "aiGender": "female",
    "userName": null,
    "userMood": "neutral",
    "userChoices": {},
    "keyFacts": [],
    "questionIndex": 0,
    "totalQuestions": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "isCorrect": true,
  "feedback": "Great! You introduced yourself clearly.",
  "adaptedResponse": "Nice to meet you, Michael!",
  "enrichedState": {
    "userName": "Michael",
    "userMood": "neutral",
    "keyFacts": ["user's name is Michael"]
  }
}
```

### POST `/api/conversation/detect-voice`

Detects speaker gender for voice selection.

**Request:**
```json
{
  "text": "My name is Anna! I'm a student.",
  "conversationHistory": [],
  "currentVoiceType": "female"
}
```

**Response:**
```json
{
  "success": true,
  "voiceType": "female",
  "confidence": 0.95,
  "reason": "Name 'Anna' indicates female speaker",
  "isNewIdentity": true,
  "shouldUpdate": true
}
```

---

## Configuration

### Built-in Profiles

| Profile ID | Description | Strictness | Dialogue Structure |
|------------|-------------|------------|-------------------|
| `default` | Balanced settings | Lenient | Required |
| `lenient` | Beginner-friendly | Lenient | Not required |
| `strict` | For advanced students | Strict | Required |

### Custom Profiles

Create a JSON file in `server/config/profiles/`:

```json
{
  "id": "my-custom-profile",
  "name": "Custom Profile",
  "targetLevel": "form2",
  "validation": {
    "strictness": "moderate",
    "requireDialogueStructure": true,
    "allowHumor": true,
    "contextualMemoryEnabled": true
  },
  "adaptation": {
    "emotionalResponses": true,
    "comparativeResponses": true,
    "nameAcknowledgment": true
  },
  "voice": {
    "defaultGender": "female",
    "speed": 0.8
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TTS_SPEED` | 0.75 | Audio generation speed |
| `TTS_STEPS_SHORT` | 10 | Quality steps for short text |
| `TTS_STEPS_DEFAULT` | 6 | Quality steps for normal text |
| `TTS_DEFAULT_VOICE_FEMALE` | F4 | Default female voice ID |
| `TTS_DEFAULT_VOICE_MALE` | M4 | Default male voice ID |

---

## Extending the Feature

### Adding New Conversation Types

1. Create a profile JSON in `server/config/profiles/`
2. Define conversation content (pieces)
3. Configure validation rules in the profile
4. Test with different user responses

### Integrating with Backend API

The code includes TODO comments for backend integration:

```typescript
// In validate.ts
// TODO: Replace with actual API endpoint when backend is ready
// const response = await fetch(`${apiDocs.conversation.validate}`, { ... })
```

### Using the Pinia Store

The Pinia store (`app/stores/conversation.ts`) provides a cleaner API:

```typescript
import { useConversationStore } from '~/stores/conversation'

const store = useConversationStore()

// Initialize
store.initializeConversation(input, 'text')

// Update from backend
store.updateFromBackend(response.enrichedState)

// Access state
console.log(store.currentPiece)
console.log(store.memoryState.userName)
```

### Customizing Prompts

Modify templates in `server/prompts/`:

- `validation/base.ts` - Core instructions
- `validation/rules.ts` - Evaluation rules
- `compose.ts` - Prompt assembly

---

## Troubleshooting

### TTS Not Working

1. Verify Supertonic paths in `.env`
2. Check Git LFS pulled assets correctly: `git lfs ls-files`
3. Restart the dev server after changes

### Voice Sounds Wrong

1. Check `TTS_SPEED` setting (0.75 recommended)
2. Verify voice ID exists (F1-F5, M1-M5)
3. Check console logs for voice detection

### Validation Too Strict/Lenient

1. Review console logs: `[conversation-validate] decision`
2. Adjust profile settings
3. Check the compact state being sent

### State Not Persisting

1. Verify `enrichedState` is returned from backend
2. Check frontend updates state after validation
3. Enable debug mode with `?debug=1`

---

## Performance Considerations

- **Audio Caching**: Generated audio is cached by piece index
- **Voice Style Caching**: Voice styles loaded once per session
- **Chunking**: Long text split for stable generation
- **Time Budget**: Steps reduced if generation exceeds 10s
- **Compact State**: Only essential context sent to OpenAI

---

## Security Notes

- OpenAI API key stored server-side only
- Audio files cleaned on server restart
- No student data persisted (session-only by default)
- Input sanitization on user answers

---

## Future Improvements

- [ ] Backend API integration for conversations
- [ ] Persistent session storage (optional)
- [ ] Analytics and progress tracking
- [ ] Multiple TTS provider support
- [ ] Offline mode with cached audio
- [ ] Teacher dashboard for monitoring
