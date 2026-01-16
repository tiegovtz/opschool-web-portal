# Conversation Practice Feature

This feature lets anyone practice conversations with AI using speech-to-text (STT) in the browser and text-to-speech (TTS) generated locally by Supertonic.

## Access

The page is accessible via direct URL only (not linked from other pages):
- **URL**: `/conversation-practice`

You can access it directly by typing the URL in your browser.

## Setup

### Prerequisites
- Node.js and pnpm installed
- Access to this repo (`tie-web-portal`)
- Supertonic binaries + assets (download directly from the official Supertonic repo; no `sd-web-admin` required)

### 1) Install dependencies
```bash
pnpm install
```

### 2) Configure environment variables
Create or update `.env` in `tie-web-portal` with absolute paths to Supertonic (adjust to your machine):
```bash
SUPERTONIC_NODEJS=/absolute/path/to/sd-web-admin/supertonic/nodejs
SUPERTONIC_ASSETS=/absolute/path/to/sd-web-admin/supertonic/assets
```

### 3) Install and prepare Supertonic 
- Clone official Supertonic:
  ```bash
  git clone https://github.com/supertone-inc/supertonic.git ~/supertonic
  ```
- Install Git LFS (required for large files), then pull assets:
  ```bash
  git lfs install
  git clone https://huggingface.co/Supertone/supertonic ~/supertonic/assets
  ```
- Install Node deps for the NodeJS binding (only needed for TTS here):
  ```bash
  cd ~/supertonic/nodejs
  npm install
  ```
- Point `.env` to your cloned paths:
  ```bash
  SUPERTONIC_NODEJS=/Users/you/supertonic/nodejs
  SUPERTONIC_ASSETS=/Users/you/supertonic/assets
  ```

### 4) Run the app
```bash
pnpm dev
```
Then open `http://localhost:3000/conversation-practice`.

## Features

### Current Implementation (Temporary)

- **Manual Conversation Input**: Enter conversation lines (one per line) in the UI
- **Input Modes**: Start by voice or by text (choose a start button)
- **STT (Speech-to-Text)**: Browser Web Speech API captures spoken answers
- **TTS (Text-to-Speech)**: Supertonic generates AI audio (M1 male, F2 female)
- **Voice Detection**: Auto-switches male/female based on conversation identity
- **Contextual Validation**: AI checks answers with current + next piece + history; gives feedback and light personalization (acknowledge mood/name) without changing the question meaning
- **Playback Control**: Playback speed slider (post-generation only)
- **Save Transcript**: Export conversation history to file

### Future Implementation (When Backend API is Ready)
- Replace manual input with backend-provided conversation context
- Use backend TTS if desired (currently local Supertonic)
- Use backend validation endpoint instead of OpenAI prompt

## How It Works

1) **Enter conversation**: Paste conversation lines (one per line), then pick **Start Interactive Conversation (Voice)** or **Start Conversation by Text**
2) **AI speaks (voice mode)**: First line is spoken via TTS (skipped in text mode)
3) **You answer**: Speak (voice mode) or type (text mode), then submit
4) **Validation**: 
   - Correct → feedback shown; moves to next line; minor personalization added to the next question (acknowledge mood/name) without changing its meaning
   - Wrong → feedback shown; includes the next-question context so you know how to adjust; try again
5) **Playback**: Adjust playback speed after audio is generated (does not affect generation speed)
6) **Save**: Export conversation history if needed

## Example Conversation

Input:
```
What's your name?
Nice to meet you, I am Grace.
How are you?
I am also well.
```

Flow:
1. AI: "What's your name?" (read via TTS)
2. User: "I am Michael" (via STT)
3. AI validates: Correct (user provided name)
4. AI: "Hi Michael, nice to meet you, I am Grace." (adapted response)
5. AI: "How are you?" (read via TTS)
6. User: "I am fine, how are you?" (via STT)
7. AI validates: Correct (user asked "how are you" back)
8. AI: "I am also well." (read via TTS)
9. Conversation complete!

## API Endpoints

### POST `/api/conversation/tts`

Generates TTS audio using Supertonic.

**Request:**
```json
{
  "text": "Hello, how are you?",
  "voiceType": "female" // or "male"
}
```

**Response:**
```json
{
  "success": true,
  "audioUrl": "/temp-audio/conversation-1234567890-abc123.wav"
}
```

### POST `/api/conversation/validate`

Validates user's answer contextually.

**Request:**
```json
{
  "conversationContext": ["What's your name?", "Nice to meet you, I am Grace."],
  "currentPiece": "What's your name?",
  "currentIndex": 0,
  "userAnswer": "I am Michael",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "success": true,
  "isCorrect": true,
  "feedback": "Correct!",
  "adaptedResponse": "Hi Michael, nice to meet you, I am Grace."
}
```

## Files Created

1. **`app/pages/conversation-practice/index.vue`**: Main conversation practice page
2. **`server/api/conversation/tts.ts`**: TTS generation endpoint using Supertonic
3. **`server/api/conversation/validate.ts`**: Answer validation endpoint with contextual awareness

## Notes

- The page uses browser Web Speech API for STT (works in Chrome, Edge, Safari)
- Supertonic TTS requires proper setup with environment variables
- Audio files are temporarily stored in `public/temp-audio/` directory
- The validation logic considers conversation context and adapts responses based on user input
- When backend APIs are ready, uncomment the TODO sections in the code
