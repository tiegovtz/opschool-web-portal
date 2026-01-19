# Chat API Documentation - Subject AI Teacher

This document explains how to access the AI Subject Teacher functionality via external API calls (e.g., Postman).

## Endpoint

**URL:** `POST /api/chat`

**Base URL:** `http://localhost:3000/api/chat` (or your server URL)

## Request Format

### Headers (Recommended - takes precedence over body)

The API accepts context information via headers. Headers are checked first and are more reliable:

```
Content-Type: application/json
X-Chapter-Name: <chapter name>          # Required for Subject AI Teacher mode
X-Subject: <subject name>               # Optional
X-Level: <education level>              # Optional
X-Topic: <topic name>                   # Optional
X-Chapter-No: <chapter number>          # Optional (integer)
Authorization: Bearer <token>           # Optional (if auth is required)
```

### Body

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is photosynthesis?"
    }
  ],
  "chapterName": "<chapter name>",      # Optional (if not in headers)
  "subject": "<subject>",                # Optional (if not in headers)
  "level": "<level>",                    # Optional (if not in headers)
  "topic": "<topic>",                    # Optional (if not in headers)
  "chapterNo": <number>                  # Optional (if not in headers)
}
```

## Response Format

The API returns a **streaming response** using Server-Sent Events (SSE) format. The response is a text stream that you need to parse incrementally.

### Response Headers

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Response Body (Stream)

The response is a stream of events in SSE format:

```
data: {"type":"text-delta","textDelta":"Hello"}

data: {"type":"text-delta","textDelta":" there"}

data: {"type":"finish","finishReason":"stop"}
```

## Postman Examples

### Example 1: Subject AI Teacher Mode (Using Headers)

**Method:** POST  
**URL:** `http://localhost:3000/api/chat`

**Headers:**
```
Content-Type: application/json
X-Chapter-Name: Photosynthesis
X-Subject: Biology
X-Level: Form 2
X-Topic: Plant Biology
X-Chapter-No: 3
```

**Body (JSON):**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Explain how photosynthesis works"
    }
  ]
}
```

### Example 2: Subject AI Teacher Mode (Using Body)

**Method:** POST  
**URL:** `http://localhost:3000/api/chat`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What are the main components of photosynthesis?"
    }
  ],
  "chapterName": "Photosynthesis",
  "subject": "Biology",
  "level": "Form 2",
  "topic": "Plant Biology",
  "chapterNo": 3
}
```

### Example 3: General TIE AI Teacher Mode (No Chapter)

**Method:** POST  
**URL:** `http://localhost:3000/api/chat`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is the Tanzanian curriculum structure?"
    }
  ]
}
```

### Example 4: Conversation with History

**Method:** POST  
**URL:** `http://localhost:3000/api/chat`

**Headers:**
```
Content-Type: application/json
X-Chapter-Name: Photosynthesis
X-Subject: Biology
```

**Body (JSON):**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is photosynthesis?"
    },
    {
      "role": "assistant",
      "content": "Photosynthesis is the process by which plants convert light energy into chemical energy..."
    },
    {
      "role": "user",
      "content": "What are the inputs and outputs?"
    }
  ]
}
```

## cURL Examples

### Subject AI Teacher with Headers

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-Chapter-Name: Photosynthesis" \
  -H "X-Subject: Biology" \
  -H "X-Level: Form 2" \
  -H "X-Topic: Plant Biology" \
  -H "X-Chapter-No: 3" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Explain photosynthesis"
      }
    ]
  }'
```

### Subject AI Teacher with Body Parameters

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What is photosynthesis?"
      }
    ],
    "chapterName": "Photosynthesis",
    "subject": "Biology",
    "level": "Form 2",
    "topic": "Plant Biology",
    "chapterNo": 3
  }'
```

## Important Notes

1. **Header vs Body Priority:** Headers take precedence over body parameters. If both are provided, headers are used.

2. **Chapter Name Validation:** 
   - The chapter name must be a valid, non-empty string
   - The value "this competence" is ignored (treated as invalid)
   - Only valid chapter names trigger "Subject AI Teacher" mode

3. **Streaming Response:** 
   - The response is streamed, so you'll receive data incrementally
   - In Postman, you may need to enable "Stream" mode or use a tool that supports SSE
   - For testing, you can use tools like `curl` or write a simple script to parse the stream

4. **Message Format:**
   - Messages array is required
   - Each message must have `role` ("user" or "assistant") and `content`
   - The last message in the array is treated as the current user question

5. **Subject AI Teacher Mode:**
   - Activated when a valid `chapterName` is provided
   - The AI will ONLY answer questions related to that specific chapter
   - Questions outside the chapter scope will be politely declined

6. **General TIE AI Teacher Mode:**
   - Activated when no valid `chapterName` is provided
   - Can answer general questions about the Tanzanian curriculum

## Testing in Postman

1. **Create a new POST request** to `http://localhost:3000/api/chat`

2. **Add headers:**
   - `Content-Type: application/json`
   - `X-Chapter-Name: <your chapter name>`
   - (Optional) Other context headers

3. **Add body (raw JSON):**
   ```json
   {
     "messages": [
       {
         "role": "user",
         "content": "Your question here"
       }
     ]
   }
   ```

4. **Send the request**
   - Note: Postman may show the streamed response differently
   - For better streaming support, consider using the Postman Console or a tool like `curl`

## Response Parsing

The streaming response contains JSON objects separated by newlines. Each line starts with `data: ` followed by a JSON object:

```javascript
// Example parser (Node.js)
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Chapter-Name': 'Photosynthesis'
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Explain photosynthesis' }]
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6));
      console.log(data);
    }
  }
}
```
