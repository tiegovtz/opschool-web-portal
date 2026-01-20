/**
 * Comprehensive test suite for the image system
 * Tests various scenarios and edge cases
 */

import { readFile } from "fs/promises";
import { join } from "path";

interface TestCase {
  name: string;
  chapter: string;
  topic?: string;
  expectedMin: number;
  expectedMax?: number;
  description: string;
}

// Simulate the getChapterFigures tool logic
async function testGetChapterFigures(chapter: string, topic?: string) {
  try {
    // Load figure-metadata.json
    const filePath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    const images = data.images || [];
    
    // Load image-shortcodes.json to verify shortcodes exist
    const shortcodesPath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const shortcodesData = JSON.parse(shortcodesContent);
    const shortcodes = shortcodesData.shortcodes || {};
    
    // Normalize chapter/topic for comparison
    const normalizeChapter = (ch: string) => ch.toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizeTopic = (t: string) => t.toLowerCase().trim().replace(/\s+/g, ' ');
    
    const queryChapter = normalizeChapter(chapter);
    
    // Filter by chapter (exact match, case-insensitive)
    let filtered = images.filter((img: any) => {
      const imgChapter = normalizeChapter(img.chapter || '');
      return imgChapter === queryChapter;
    });
    
    // Filter by topic if provided (improved matching: exact first, then flexible for syllabus differences)
    if (topic && topic.trim()) {
      const queryTopic = normalizeTopic(topic);
      const queryWords = queryTopic.split(/\s+/).filter(w => w.length > 2);
      const isSingleWord = queryWords.length === 1;
      
      // First, try exact match
      let exactMatches = filtered.filter((img: any) => {
        const imgTopic = normalizeTopic(img.topic || '');
        return imgTopic === queryTopic;
      });
      
      // If exact matches found, use only those (unless it's a single-word query from syllabus)
      if (exactMatches.length > 0 && !isSingleWord) {
        filtered = exactMatches;
      } else {
        // For single-word queries or when no exact match, use flexible matching
        filtered = filtered.filter((img: any) => {
          const imgTopic = normalizeTopic(img.topic || '');
          
          // Exact match (highest priority)
          if (imgTopic === queryTopic) return true;
          
          // For single-word queries (e.g., "photosynthesis" from syllabus)
          if (isSingleWord) {
            // Match topics containing that word (broad match for syllabus topic names)
            return imgTopic.includes(queryWords[0]);
          }
          
          // For multi-word queries, be more precise
          // Only match if the query phrase is contained in the topic
          if (imgTopic.includes(queryTopic)) {
            return true;
          }
          
          return false;
        });
      }
    }
    
    // Map to return format
    const figures = filtered.map((img: any) => ({
      figure_number: img.figure_number || '',
      caption: img.caption || '',
      shortcode: img.shortcode || '',
      page_number: img.page_number || null,
      chapter: img.chapter || '',
      topic: img.topic || '',
      hasUrl: !!shortcodes[img.shortcode]?.path
    }));
    
    return {
      found: figures.length > 0,
      count: figures.length,
      figures,
      shortcodesWithUrls: figures.filter(f => f.hasUrl).length,
      shortcodesWithoutUrls: figures.filter(f => !f.hasUrl).length
    };
  } catch (error: any) {
    return {
      found: false,
      error: error.message,
      count: 0,
      figures: []
    };
  }
}

async function runComprehensiveTests() {
  console.log('🧪 Comprehensive Image System Test Suite\n');
  console.log('='.repeat(70));
  
  const testCases: TestCase[] = [
    {
      name: 'Chapter 6 - All figures',
      chapter: 'Chapter Six: Nutrition in plants',
      expectedMin: 15,
      description: 'Should return all 15 figures for the chapter'
    },
    {
      name: 'Chapter 6 - Exact topic match',
      chapter: 'Chapter Six: Nutrition in plants',
      topic: 'The process of photosynthesis',
      expectedMin: 6,
      expectedMax: 6,
      description: 'Should return exactly 6 figures for "The process of photosynthesis"'
    },
    {
      name: 'Chapter 6 - Syllabus topic name (single word)',
      chapter: 'Chapter Six: Nutrition in plants',
      topic: 'Photosynthesis',
      expectedMin: 6,
      expectedMax: 13,
      description: 'Should match "The process of photosynthesis" topic (flexible matching)'
    },
    {
      name: 'Chapter 6 - Leaf structure topic',
      chapter: 'Chapter Six: Nutrition in plants',
      topic: 'Structure of the leaf in relation to photosynthesis',
      expectedMin: 2,
      expectedMax: 2,
      description: 'Should return exactly 2 figures for leaf structure'
    },
    {
      name: 'Chapter 1 - All figures',
      chapter: 'Chapter One: Introduction to Biology',
      expectedMin: 5,
      description: 'Should return all 5 figures for Chapter 1'
    },
    {
      name: 'Chapter 1 - Specific topic',
      chapter: 'Chapter One: Introduction to Biology',
      topic: 'Importance of studying Biology',
      expectedMin: 1,
      expectedMax: 1,
      description: 'Should return 1 figure for this topic'
    },
    {
      name: 'Chapter 2 - All figures',
      chapter: 'Chapter Two: Scientific processes in Biology',
      expectedMin: 20,
      description: 'Should return all figures for Chapter 2'
    },
    {
      name: 'Chapter 2 - Laboratory equipment',
      chapter: 'Chapter Two: Scientific processes in Biology',
      topic: 'Common Biology laboratory apparati, equipment and other resources',
      expectedMin: 20,
      description: 'Should return figures for laboratory equipment topic'
    },
    {
      name: 'Chapter 3 - All figures',
      chapter: 'Chapter Three: Cell structure and organization',
      expectedMin: 15,
      description: 'Should return all figures for Chapter 3'
    },
    {
      name: 'Chapter 3 - Cell types',
      chapter: 'Chapter Three: Cell structure and organization',
      topic: 'Types of cells',
      expectedMin: 1,
      description: 'Should return figures for cell types'
    },
    {
      name: 'Non-existent chapter',
      chapter: 'Chapter 99: Non-existent Chapter',
      expectedMin: 0,
      expectedMax: 0,
      description: 'Should return 0 figures for non-existent chapter'
    },
    {
      name: 'Chapter 6 - Non-existent topic',
      chapter: 'Chapter Six: Nutrition in plants',
      topic: 'Non-existent topic',
      expectedMin: 0,
      expectedMax: 0,
      description: 'Should return 0 figures for non-existent topic'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  const issues: string[] = [];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   Query: chapter="${testCase.chapter}"${testCase.topic ? `, topic="${testCase.topic}"` : ''}`);
    
    const result = await testGetChapterFigures(testCase.chapter, testCase.topic);
    
    // Check if result meets expectations
    const meetsMin = result.count >= testCase.expectedMin;
    const meetsMax = testCase.expectedMax ? result.count <= testCase.expectedMax : true;
    const passedTest = meetsMin && meetsMax;
    
    if (passedTest) {
      console.log(`   ✅ PASSED: Found ${result.count} figures (expected: ${testCase.expectedMin}${testCase.expectedMax ? `-${testCase.expectedMax}` : '+'})`);
      passed++;
    } else {
      console.log(`   ❌ FAILED: Found ${result.count} figures (expected: ${testCase.expectedMin}${testCase.expectedMax ? `-${testCase.expectedMax}` : '+'})`);
      failed++;
      issues.push(`${testCase.name}: Expected ${testCase.expectedMin}${testCase.expectedMax ? `-${testCase.expectedMax}` : '+'} but got ${result.count}`);
    }
    
    // Check shortcode availability
    if (result.count > 0) {
      console.log(`   📊 Shortcode status: ${result.shortcodesWithUrls} with URLs, ${result.shortcodesWithoutUrls} without URLs`);
      if (result.shortcodesWithoutUrls > 0) {
        const missing = result.figures.filter(f => !f.hasUrl).map(f => f.shortcode);
        console.log(`   ⚠️  Missing URLs: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`);
        issues.push(`${testCase.name}: ${result.shortcodesWithoutUrls} shortcodes missing URLs`);
      }
    }
    
    // Show sample figures
    if (result.count > 0 && result.count <= 5) {
      result.figures.forEach((fig, idx) => {
        console.log(`      ${idx + 1}. ${fig.figure_number}: ${fig.caption.substring(0, 45)}...`);
      });
    } else if (result.count > 5) {
      console.log(`   Sample figures (showing first 3 of ${result.count}):`);
      result.figures.slice(0, 3).forEach((fig, idx) => {
        console.log(`      ${idx + 1}. ${fig.figure_number}: ${fig.caption.substring(0, 45)}...`);
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Test Summary:');
  console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
  
  if (issues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (failed > 0) {
    console.log('   1. Review topic matching logic - some queries may be too broad or too narrow');
  }
  
  // Check for missing shortcodes across all tests
  let totalMissingShortcodes = 0;
  for (const testCase of testCases) {
    const result = await testGetChapterFigures(testCase.chapter, testCase.topic);
    totalMissingShortcodes += result.shortcodesWithoutUrls || 0;
  }
  
  if (totalMissingShortcodes > 0) {
    console.log(`   2. Add missing URLs for ${totalMissingShortcodes} shortcodes in image-shortcodes.json`);
  }
  console.log('   3. Ensure AI prompt emphasizes MANDATORY image usage when figures are available');
  console.log('   4. Monitor server logs for [getChapterFigures] tool calls during actual usage');
  
  console.log('\n✅ Test suite complete!');
}

runComprehensiveTests().catch(console.error);

