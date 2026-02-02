/**
 * Automated test script to verify AI teacher produces images in responses
 * Makes actual API calls to /api/chat and validates responses
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

interface TestResult {
  name: string;
  message: string;
  success: boolean;
  hasImage: boolean;
  imageShortcodes: string[];
  toolCalls?: string[];
  responsePreview: string;
  error?: string;
  chapterMatched?: string;
  figuresFound?: number;
}

interface ChatResponse {
  text?: string;
  toolCalls?: Array<{ toolName: string; args: any; result: any }>;
  steps?: Array<{ toolCalls?: Array<{ toolName: string }> }>;
}

// Test messages that should produce images
const testMessages = [
  {
    name: "Teaching Chapter One - Basic concepts",
    message: "I want to learn about living things and basic biology concepts",
    expectedChapter: "Chapter One: Introduction to Biology",
    expectedTopic: "Basic concepts and terminologies in Biology",
    shouldProduceImage: true
  },
  {
    name: "Teaching Chapter Two - Laboratory equipment",
    message: "Can you teach me about Biology laboratory equipment?",
    expectedChapter: "Chapter Two: Scientific processes in Biology",
    expectedTopic: "Common Biology laboratory apparati, equipment and other resources",
    shouldProduceImage: true
  },
  {
    name: "Teaching Chapter Six - Photosynthesis",
    message: "Explain photosynthesis in plants",
    expectedChapter: "Chapter Six: Nutrition in plants",
    expectedTopic: "The process of photosynthesis",
    shouldProduceImage: true
  },
  {
    name: "Specific topic - Photosynthesis process",
    message: "How does photosynthesis work?",
    expectedChapter: "Chapter Six: Nutrition in plants",
    expectedTopic: "The process of photosynthesis",
    shouldProduceImage: true
  },
  {
    name: "Specific topic - Plant cell structure",
    message: "What is the structure of plant cells?",
    expectedChapter: "Chapter Three: Cell structure and organization",
    expectedTopic: "Animal and plant cells",
    shouldProduceImage: true
  }
];

function extractImageShortcodes(response: string): string[] {
  // The response is in SSE format: data: {"type":"text-delta","textDelta":"[image:shortcode]"}
  // We need to extract all text content from SSE data chunks, then find [image:...] patterns
  const matches: string[] = [];
  let fullText = '';
  
  // Parse SSE format: extract all textDelta values and concatenate
  const lines = response.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const jsonStr = line.substring(6); // Remove "data: " prefix
        const data = JSON.parse(jsonStr);
        if (data.textDelta) {
          fullText += data.textDelta;
        } else if (data.text) {
          fullText += data.text;
        }
      } catch (e) {
        // Not JSON, skip
      }
    }
  }
  
  // If no SSE format detected, use the raw response
  if (!fullText) {
    fullText = response;
  }
  
  // Extract [image:shortcode] patterns from the full text
  const regex = /\[image:([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(fullText)) !== null) {
    matches.push(match[1]);
  }
  
  return [...new Set(matches)]; // Remove duplicates
}

async function testAIImageResponse(
  message: string,
  testName: string,
  baseUrl: string = 'http://localhost:3000',
  authToken?: string
): Promise<TestResult> {
  console.log(`\n[test-ai] 🧪 Testing: ${testName}`);
  console.log(`[test-ai] Message: "${message}"`);
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Cookie'] = `signInAccessToken=${authToken}`;
    }
    
    // UIMessage format expected by convertToModelMessages from @ai-sdk/vue
    // Based on @ai-sdk/vue Chat component, messages use { id, role, parts } format
    // where parts is an array of { type: 'text', text: string }
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [
          { 
            id: messageId,
            role: 'user', 
            parts: [
              { type: 'text', text: message }
            ]
          }
        ]
      })
    });
    
    if (!response.ok) {
      // Clone response before reading to avoid "Body already read" error
      const clonedResponse = response.clone();
      const errorText = await clonedResponse.text().catch(() => '');
      return {
        name: testName,
        message,
        success: false,
        hasImage: false,
        imageShortcodes: [],
        responsePreview: '',
        error: `HTTP ${response.status}: ${errorText || response.statusText}`
      };
    }
    
    // Try to parse as streaming response or JSON
    const contentType = response.headers.get('content-type') || '';
    let responseText = '';
    let toolCalls: string[] = [];
    
    // /api/chat returns a streaming response (text/event-stream or text/stream)
    if (contentType.includes('text/stream') || contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
      // Handle streaming response - read the body once
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          responseText += decoder.decode(value, { stream: true });
        }
      } else {
        // Fallback: read as text
        responseText = await response.text();
      }
    } else {
      // Try JSON response (unlikely for /api/chat, but handle it)
      try {
        const data = await response.json();
        if (typeof data === 'string') {
          responseText = data;
        } else if (data.text) {
          responseText = data.text;
        } else if (data.message) {
          responseText = data.message;
        } else {
          responseText = JSON.stringify(data);
        }
        
        // Extract tool calls if present
        if (data.toolCalls) {
          toolCalls = data.toolCalls.map((tc: any) => tc.toolName || tc.tool).filter(Boolean);
        }
        if (data.steps) {
          data.steps.forEach((step: any) => {
            if (step.toolCalls) {
              step.toolCalls.forEach((tc: any) => {
                if (tc.toolName) toolCalls.push(tc.toolName);
              });
            }
          });
        }
      } catch (e) {
        // If JSON parsing fails, try text
        responseText = await response.text();
      }
    }
    
    const imageShortcodes = extractImageShortcodes(responseText);
    
    // Filter out generic placeholder text (instructions/examples use "shortcode_name" literally)
    const validShortcodes = imageShortcodes.filter(sc => 
      sc !== 'shortcode' && 
      sc !== 'shortcode_name' && 
      sc.length > 3 &&
      !sc.includes('placeholder') &&
      !sc.startsWith('example_') &&
      !sc.includes('example')
    );
    
    const hasImage = validShortcodes.length > 0;
    const preview = responseText.substring(0, 200).replace(/\n/g, ' ').trim();
    
    // Extract tool calls and parameters from SSE response
    const getChapterFiguresCalls: Array<{ chapter: string; topic?: string; result?: any }> = [];
    
    // Parse SSE format to extract tool call data
    const lines = responseText.split('\n');
    let currentToolCall: any = null;
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const jsonStr = line.substring(6);
          const data = JSON.parse(jsonStr);
          
          // Check for tool input start
          if (data.type === 'tool-input-start' && data.toolName === 'getChapterFigures') {
            currentToolCall = { chapter: '', topic: undefined };
          }
          
          // Check for tool input delta (arguments)
          if (currentToolCall && data.type === 'tool-input-delta' && data.argsDelta) {
            let argsDelta = typeof data.argsDelta === 'string' ? data.argsDelta : JSON.stringify(data.argsDelta);
            // argsDelta might be a partial JSON string, accumulate it
            if (!currentToolCall.argsDelta) {
              currentToolCall.argsDelta = '';
            }
            currentToolCall.argsDelta += argsDelta;
            
            // Try to parse complete JSON if we have it
            try {
              const parsed = JSON.parse(currentToolCall.argsDelta);
              if (parsed.chapter) currentToolCall.chapter = parsed.chapter;
              if (parsed.topic) currentToolCall.topic = parsed.topic;
            } catch (e) {
              // Not complete JSON yet, try regex extraction
              if (currentToolCall.argsDelta.includes('chapter')) {
                const chapterMatch = currentToolCall.argsDelta.match(/"chapter"\s*:\s*"([^"]+)"/);
                if (chapterMatch) currentToolCall.chapter = chapterMatch[1];
                const topicMatch = currentToolCall.argsDelta.match(/"topic"\s*:\s*"([^"]+)"/);
                if (topicMatch) currentToolCall.topic = topicMatch[1];
              }
            }
          }
          
          // Check for tool result
          if (currentToolCall && data.type === 'tool-result' && data.toolName === 'getChapterFigures') {
            currentToolCall.result = data.result;
            getChapterFiguresCalls.push(currentToolCall);
            currentToolCall = null;
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }
    
    const getChapterFiguresCalled = getChapterFiguresCalls.length > 0 || 
                                     responseText.toLowerCase().includes('getchapterfigures') || 
                                     responseText.toLowerCase().includes('get_chapter_figures') ||
                                     responseText.includes('"toolName":"getChapterFigures"');
    
    console.log(`[test-ai] Response length: ${responseText.length} chars`);
    console.log(`[test-ai] Images found: ${hasImage ? `✅ ${validShortcodes.length}` : '❌ None'}`);
    if (hasImage) {
      console.log(`[test-ai] Shortcodes: ${validShortcodes.join(', ')}`);
    } else if (imageShortcodes.length > 0) {
      console.log(`[test-ai] ⚠️  Found ${imageShortcodes.length} patterns but filtered out (likely placeholders): ${imageShortcodes.join(', ')}`);
    }
    if (!hasImage) {
      console.log(`[test-ai] getChapterFigures called: ${getChapterFiguresCalled ? '✅ Yes' : '❌ No'}`);
      if (getChapterFiguresCalls.length > 0) {
        getChapterFiguresCalls.forEach((call, idx) => {
          console.log(`[test-ai]   Call ${idx + 1}: chapter="${call.chapter}", topic="${call.topic || 'none'}"`);
          if (call.result) {
            const found = call.result.found !== false;
            const figureCount = call.result.figures?.length || call.result.total || 0;
            console.log(`[test-ai]     Result: ${found ? '✅ Found' : '❌ Not found'} - ${figureCount} figures`);
          }
        });
      }
    }
    if (toolCalls.length > 0) {
      console.log(`[test-ai] Tool calls: ${toolCalls.join(', ')}`);
    }
    
    return {
      name: testName,
      message,
      success: true,
      hasImage,
      imageShortcodes: validShortcodes.length > 0 ? validShortcodes : [],
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      responsePreview: preview + (responseText.length > 200 ? '...' : ''),
      getChapterFiguresCalls: getChapterFiguresCalls.length > 0 ? getChapterFiguresCalls : undefined
    };
  } catch (error: any) {
    console.error(`[test-ai] ❌ Error:`, error.message);
    return {
      name: testName,
      message,
      success: false,
      hasImage: false,
      imageShortcodes: [],
      responsePreview: '',
      error: error.message
    };
  }
}

async function loadFigureMetadata() {
  try {
    const filePath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.images || [];
  } catch (error: any) {
    console.error('[test-ai] Failed to load figure-metadata.json:', error.message);
    return [];
  }
}

async function runAutomatedTests() {
  console.log('='.repeat(80));
  console.log('[test-ai] 🤖 Automated AI Image Response Test Suite');
  console.log('='.repeat(80));
  
  // Check for auth token from environment or command line
  const authToken = process.env.AUTH_TOKEN || process.argv.find(arg => arg.startsWith('--token='))?.split('=')[1];
  const baseUrl = process.env.API_URL || process.argv.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000';
  
  // Note: /api/chat does NOT require user authentication (no signInAccessToken check)
  // It only needs OpenAI API key in server config (not passed in request)
  console.log(`[test-ai] ℹ️  Note: /api/chat endpoint does not require user authentication`);
  console.log(`[test-ai] ℹ️  Only OpenAI API key in server config is needed\n`);
  
  console.log(`[test-ai] 🌐 API URL: ${baseUrl}\n`);
  
  // Load figure metadata for validation
  const figures = await loadFigureMetadata();
  console.log(`[test-ai] 📊 Loaded ${figures.length} figures from figure-metadata.json\n`);
  
  const results: TestResult[] = [];
  
  // Run tests
  for (const test of testMessages) {
    const result = await testAIImageResponse(test.message, test.name, baseUrl, authToken);
    
    // Check if expected chapter has images
    if (test.expectedChapter) {
      const chapterFigures = figures.filter((f: any) => 
        f.chapter.toLowerCase() === test.expectedChapter.toLowerCase()
      );
      result.chapterMatched = test.expectedChapter;
      result.figuresFound = chapterFigures.length;
    }
    
    results.push(result);
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('[test-ai] 📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  let passedTests = 0;
  let failedTests = 0;
  let imageTests = 0;
  let noImageTests = 0;
  
  results.forEach((result, index) => {
    const test = testMessages[index];
    const status = result.success 
      ? (result.hasImage === test.shouldProduceImage ? '✅ PASS' : '⚠️  PARTIAL')
      : '❌ FAIL';
    
    console.log(`\n${index + 1}. ${result.name} - ${status}`);
    console.log(`   Message: "${result.message}"`);
    
    if (result.success) {
      console.log(`   Response: ${result.responsePreview}`);
      console.log(`   Images: ${result.hasImage ? `✅ ${result.imageShortcodes.length} found` : '❌ None found'}`);
      if (result.imageShortcodes.length > 0) {
        console.log(`   Shortcodes: ${result.imageShortcodes.join(', ')}`);
      }
      if (result.toolCalls && result.toolCalls.length > 0) {
        const hasGetChapterFigures = result.toolCalls.includes('getChapterFigures') || result.toolCalls.some(tc => tc.toLowerCase().includes('chapter'));
        console.log(`   Tool calls: ${result.toolCalls.join(', ')} ${hasGetChapterFigures ? '✅' : '⚠️'}`);
      }
      if (result.figuresFound !== undefined) {
        console.log(`   Expected figures: ${result.figuresFound} available in metadata`);
      }
      
      if (result.hasImage === test.shouldProduceImage) {
        passedTests++;
        if (result.hasImage) imageTests++;
      } else {
        noImageTests++;
      }
    } else {
      console.log(`   Error: ${result.error}`);
      failedTests++;
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('[test-ai] 📈 STATISTICS');
  console.log('='.repeat(80));
  console.log(`Total tests: ${results.length}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`✅ With images: ${imageTests}`);
  console.log(`⚠️  Expected images but none found: ${noImageTests}`);
  console.log(`Success rate: ${((passedTests / results.length) * 100).toFixed(1)}%`);
  
  // Determine overall result
  const allPassed = passedTests === results.length && failedTests === 0;
  
  console.log('\n' + '='.repeat(80));
  console.log(`[test-ai] ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED OR INCOMPLETE'}`);
  console.log('='.repeat(80));
  
  return allPassed ? 0 : 1;
}

// Run the tests
runAutomatedTests()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('[test-ai] ❌ Script failed:', error);
    process.exit(1);
  });

