# AI Assistant API Documentation - Summarize & Crash Course

This document explains how to access the **Summarize** and **English Crash Course** features via external API calls (e.g., Postman).

## Endpoint

**URL:** `POST /api/ai-assistant/ask`

**Base URL:** `http://localhost:3000/api/ai-assistant/ask` (or your server URL)

## Request Format

### Headers

```
Content-Type: application/json
Authorization: Bearer <your_access_token>
```

**Note:** The authorization token can be obtained from:
- Cookie: `signInAccessToken` (if using browser)
- Or passed in the `Authorization` header as shown above

### Request Body

```json
{
  "question": "<your_prompt_here>",
  "chapterId": "<chapter_id>",
  "conversationHistory": []  // Optional: array of previous messages
}
```

### Required Fields

- **question** (string): The prompt/question to send to the AI assistant
- **chapterId** (string): The ID of the chapter/competence

### Optional Fields

- **conversationHistory** (array): Previous conversation messages for context
  ```json
  [
    {
      "role": "user",
      "content": "Previous user message"
    },
    {
      "role": "assistant",
      "content": "Previous assistant response"
    }
  ]
  ```

## Response Format

```json
{
  "answer": "<AI generated response>",
  "chapterName": "<chapter name>",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "finishReason": "stop",
  "provider": "OpenAI",
  "model": "gpt-4o-mini"
}
```

## Postman Examples

### Example 1: Summarize Endpoint

**Method:** POST  
**URL:** `http://localhost:3000/api/ai-assistant/ask`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Body (raw JSON):**
```json
{
  "question": "Please provide a comprehensive summary of this chapter/competence: Introduction to Photosynthesis. Include main concepts, key points, and important information.",
  "chapterId": "your-chapter-id-here"
}
```

**Expected Response:**
```json
{
  "answer": "## Summary of Introduction to Photosynthesis\n\nPhotosynthesis is the process by which plants convert light energy into chemical energy...",
  "chapterName": "Introduction to Photosynthesis",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "finishReason": "stop",
  "provider": "OpenAI",
  "model": "gpt-4o-mini"
}
```

### Example 2: English Crash Course Endpoint

**Method:** POST  
**URL:** `http://localhost:3000/api/ai-assistant/ask`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Body (raw JSON):**
```json
{
  "question": "I'm a Tanzanian student who learned in Swahili. Please explain this chapter/competence \"Introduction to Photosynthesis\" in simple English, helping me understand the key concepts and terms. Use Tanzanian context, examples, and references that relate to Tanzania. Use simple language and provide examples where helpful. use swahili to make more emphasis on points.",
  "chapterId": "your-chapter-id-here"
}
```

**Expected Response:**
```json
{
  "answer": "Karibu! (Welcome!) Let me explain photosynthesis in simple English...",
  "chapterName": "Introduction to Photosynthesis",
  "timestamp": "2024-01-15T10:35:00.000Z",
  "finishReason": "stop",
  "provider": "OpenAI",
  "model": "gpt-4o-mini"
}
```

### Example 3: With Conversation History

**Method:** POST  
**URL:** `http://localhost:3000/api/ai-assistant/ask`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Body (raw JSON):**
```json
{
  "question": "Can you explain more about the light-dependent reactions?",
  "chapterId": "your-chapter-id-here",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Please provide a comprehensive summary of this chapter/competence: Introduction to Photosynthesis. Include main concepts, key points, and important information."
    },
    {
      "role": "assistant",
      "content": "Photosynthesis is the process by which plants convert light energy into chemical energy..."
    }
  ]
}
```

## Prompt Templates

### Summarize Prompt Template

Replace `<CHAPTER_NAME>` with the actual chapter name:

```
Please provide a comprehensive summary of this chapter/competence: <CHAPTER_NAME>. Include main concepts, key points, and important information.
```

### English Crash Course Prompt Template

Replace `<CHAPTER_NAME>` with the actual chapter name:

```
I'm a Tanzanian student who learned in Swahili. Please explain this chapter/competence "<CHAPTER_NAME>" in simple English, helping me understand the key concepts and terms. Use Tanzanian context, examples, and references that relate to Tanzania. Use simple language and provide examples where helpful. use swahili to make more emphasis on points.
```

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "No authorization token provided. Please sign in."
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Missing required fields. Question: true, ChapterId: false"
}
```

### 503 Service Unavailable
```json
{
  "statusCode": 503,
  "message": "Both primary (OpenAI) and fallback (Ollama) providers failed..."
}
```

## Step-by-Step Postman Setup

1. **Create a new request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/ai-assistant/ask`

2. **Set Headers**
   - Click on "Headers" tab
   - Add:
     - Key: `Content-Type`, Value: `application/json`
     - Key: `Authorization`, Value: `Bearer YOUR_TOKEN_HERE`

3. **Set Body**
   - Click on "Body" tab
   - Select "raw"
   - Select "JSON" from dropdown
   - Paste the JSON body (use examples above)

4. **Send Request**
   - Click "Send" button
   - View response in the response panel

## Getting Your Access Token

To get your access token:

1. **From Browser (if logged in):**
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Check Cookies for `signInAccessToken`

2. **From Login API:**
   - Call your login endpoint first
   - Extract token from response or cookies

## Notes

- The endpoint uses OpenAI GPT-4o-mini as primary provider
- Falls back to Ollama Gemma if OpenAI fails
- Maximum conversation history: 20 messages (10 user + 10 assistant)
- Chapter content is automatically fetched using the `chapterId`
- The AI response is tailored for Tanzanian students with local context
