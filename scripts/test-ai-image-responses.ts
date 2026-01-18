/**
 * Test script to verify AI teacher produces images in responses
 * Tests various messages that should trigger image usage
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

// Test messages that should produce images
const testMessages = [
  {
    name: "Teaching Chapter One - Basic concepts",
    message: "I want to learn about living things and basic biology concepts",
    expectedChapter: "Chapter One: Introduction to Biology",
    expectedTopics: ["Basic concepts and terminologies in Biology"],
    shouldProduceImage: true
  },
  {
    name: "Teaching Chapter Two - Laboratory equipment",
    message: "Can you teach me about Biology laboratory equipment?",
    expectedChapter: "Chapter Two: Scientific processes in Biology",
    expectedTopics: ["Common Biology laboratory apparati, equipment and other resources"],
    shouldProduceImage: true
  },
  {
    name: "Teaching Chapter Six - Photosynthesis",
    message: "Explain photosynthesis in plants",
    expectedChapter: "Chapter Six: Nutrition in plants",
    expectedTopics: ["The process of photosynthesis", "Structure of the leaf in relation to photosynthesis"],
    shouldProduceImage: true
  },
  {
    name: "Specific topic question - Photosynthesis",
    message: "How does photosynthesis work?",
    expectedChapter: "Chapter Six: Nutrition in plants",
    expectedTopics: ["The process of photosynthesis"],
    shouldProduceImage: true
  },
  {
    name: "Specific topic question - Cell structure",
    message: "What is the structure of plant cells?",
    expectedChapter: "Chapter Three: Cell structure and organization",
    expectedTopics: ["Animal and plant cells"],
    shouldProduceImage: true
  },
  {
    name: "General question without context",
    message: "What is biology?",
    expectedChapter: undefined,
    shouldProduceImage: false // May or may not produce images depending on context
  }
];

interface FigureMetadata {
  chapter: string;
  topic: string;
  figure_number: string;
  caption: string;
  shortcode?: string;
}

async function loadFigureMetadata(): Promise<FigureMetadata[]> {
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

function checkIfImagesAvailableForChapter(
  figures: FigureMetadata[],
  chapter: string,
  topic?: string
): boolean {
  const chapterFigures = figures.filter((fig: FigureMetadata) => 
    fig.chapter.toLowerCase() === chapter.toLowerCase()
  );
  
  if (!topic) {
    return chapterFigures.length > 0;
  }
  
  const topicFigures = chapterFigures.filter((fig: FigureMetadata) => {
    const figTopic = (fig.topic || '').toLowerCase();
    const searchTopic = topic.toLowerCase();
    
    // Exact match or contains
    return figTopic === searchTopic || figTopic.includes(searchTopic) || searchTopic.includes(figTopic);
  });
  
  return topicFigures.length > 0;
}

function extractImageShortcodes(response: string): string[] {
  // Match [image:shortcode_name] format
  const regex = /\[image:([^\]]+)\]/g;
  const matches: string[] = [];
  let match;
  
  while ((match = regex.exec(response)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

async function testAIImageResponse(
  message: string,
  testName: string
): Promise<{
  success: boolean;
  hasImage: boolean;
  imageShortcodes: string[];
  responsePreview: string;
  error?: string;
}> {
  console.log(`\n[test-ai] 🧪 Testing: ${testName}`);
  console.log(`[test-ai] Message: "${message}"`);
  
  try {
    // In a real test, you would call the actual API
    // For now, we'll simulate by checking if images are available for expected chapters
    console.log(`[test-ai] ⚠️ This is a dry run - actual API calls require authentication`);
    console.log(`[test-ai] ⚠️ To test with real API, you need to:`);
    console.log(`[test-ai]    1. Have a valid signInAccessToken cookie`);
    console.log(`[test-ai]    2. Make POST request to /api/chat with messages`);
    console.log(`[test-ai]    3. Check response for [image:shortcode] patterns`);
    
    return {
      success: true,
      hasImage: false, // Will be set by actual API call
      imageShortcodes: [],
      responsePreview: "[Simulated - requires actual API call]"
    };
  } catch (error: any) {
    return {
      success: false,
      hasImage: false,
      imageShortcodes: [],
      responsePreview: "",
      error: error.message
    };
  }
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('[test-ai] 🧪 AI Image Response Test Suite');
  console.log('='.repeat(80));
  
  // Load figure metadata to check availability
  const figures = await loadFigureMetadata();
  console.log(`[test-ai] ✅ Loaded ${figures.length} figures from figure-metadata.json`);
  
  // Analyze available figures by chapter
  const figuresByChapter = new Map<string, number>();
  figures.forEach((fig: FigureMetadata) => {
    const count = figuresByChapter.get(fig.chapter) || 0;
    figuresByChapter.set(fig.chapter, count + 1);
  });
  
  console.log('\n[test-ai] 📊 Figures available by chapter:');
  Array.from(figuresByChapter.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([chapter, count]) => {
      console.log(`  - ${chapter}: ${count} figures`);
    });
  
  console.log('\n[test-ai] 📝 Test Messages:');
  testMessages.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   Message: "${test.message}"`);
    console.log(`   Expected Chapter: ${test.expectedChapter || 'N/A'}`);
    
    if (test.expectedChapter) {
      const hasImages = checkIfImagesAvailableForChapter(
        figures,
        test.expectedChapter,
        test.expectedTopics?.[0]
      );
      console.log(`   Images Available: ${hasImages ? '✅ YES' : '❌ NO'}`);
      
      if (test.expectedTopics) {
        console.log(`   Expected Topics: ${test.expectedTopics.join(', ')}`);
        test.expectedTopics.forEach(topic => {
          const hasTopicImages = checkIfImagesAvailableForChapter(figures, test.expectedChapter!, topic);
          console.log(`     - ${topic}: ${hasTopicImages ? '✅' : '❌'} (${figures.filter(f => 
            f.chapter === test.expectedChapter && 
            (f.topic?.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(f.topic?.toLowerCase() || ''))
          ).length} figures)`);
        });
      }
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('[test-ai] 💡 To test with actual API responses:');
  console.log('='.repeat(80));
  console.log(`
1. Make sure the server is running
2. You have a valid authentication token
3. Use curl or Postman to send POST requests to /api/chat:

   curl -X POST http://localhost:3000/api/chat \\
     -H "Content-Type: application/json" \\
     -H "Cookie: signInAccessToken=YOUR_TOKEN" \\
     -d '{
       "messages": [
         {"role": "user", "content": "I want to learn about living things and basic biology concepts"}
       ]
     }'

4. Check the response for [image:shortcode] patterns
5. Verify that getChapterFigures tool was called in server logs
6. Verify that images are displayed correctly in the frontend

Example test commands:
${testMessages.slice(0, 3).map((test, i) => `
Test ${i + 1}: ${test.name}
curl -X POST http://localhost:3000/api/chat \\
  -H "Content-Type: application/json" \\
  -H "Cookie: signInAccessToken=YOUR_TOKEN" \\
  -d '{"messages": [{"role": "user", "content": "${test.message}"}]}'
`).join('\n')}
  `);
  
  console.log('\n[test-ai] ✅ Test analysis complete!');
}

// Run the tests
runTests()
  .then(() => {
    console.log('[test-ai] ✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[test-ai] ❌ Script failed:', error);
    process.exit(1);
  });


