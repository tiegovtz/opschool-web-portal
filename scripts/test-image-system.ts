/**
 * Test script to verify the image system is working correctly
 * Tests getChapterFigures tool with example queries
 */

import { readFile } from "fs/promises";
import { join } from "path";

// Simulate the getChapterFigures tool logic
async function testGetChapterFigures(chapter: string, topic?: string) {
  try {
    console.log(`\n🔍 Testing: chapter="${chapter}", topic="${topic || 'all'}"`);
    
    // Load figure-metadata.json
    const filePath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    const images = data.images || [];
    
    // Normalize chapter/topic for comparison
    const normalizeChapter = (ch: string) => ch.toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizeTopic = (t: string) => t.toLowerCase().trim().replace(/\s+/g, ' ');
    
    const queryChapter = normalizeChapter(chapter);
    
    // Filter by chapter (exact match, case-insensitive)
    let filtered = images.filter((img: any) => {
      const imgChapter = normalizeChapter(img.chapter || '');
      return imgChapter === queryChapter;
    });
    
    console.log(`   Found ${filtered.length} figures for chapter`);
    
    // Filter by topic if provided (flexible matching)
    if (topic && topic.trim()) {
      const queryTopic = normalizeTopic(topic);
      const beforeCount = filtered.length;
      
      filtered = filtered.filter((img: any) => {
        const imgTopic = normalizeTopic(img.topic || '');
        // Exact match (highest priority)
        if (imgTopic === queryTopic) return true;
        
        // For single-word queries (e.g., "photosynthesis"), match topics containing that word
        const queryWords = queryTopic.split(/\s+/).filter(w => w.length > 2);
        if (queryWords.length === 1) {
          // Single word: match if topic contains it
          return imgTopic.includes(queryWords[0]);
        }
        
        // For multi-word queries, check if one contains the other
        if (imgTopic.includes(queryTopic) || queryTopic.includes(imgTopic)) return true;
        
        // Check if key words match
        const imgWords = imgTopic.split(/\s+/).filter(w => w.length > 2);
        if (queryWords.length > 0 && imgWords.length > 0) {
          const matchingWords = queryWords.filter(qw => imgWords.some(iw => iw.includes(qw) || qw.includes(iw)));
          // If at least 60% of key words match, consider it a match
          if (matchingWords.length / queryWords.length >= 0.6) return true;
        }
        return false;
      });
      
      console.log(`   After topic filter: ${filtered.length} figures (filtered ${beforeCount - filtered.length})`);
    }
    
    // Map to return format
    const figures = filtered.map((img: any) => ({
      figure_number: img.figure_number || '',
      caption: img.caption || '',
      shortcode: img.shortcode || '',
      page_number: img.page_number || null,
      chapter: img.chapter || '',
      topic: img.topic || ''
    }));
    
    if (figures.length === 0) {
      console.log(`   ❌ No figures found`);
      return { found: false, figures: [] };
    }
    
    console.log(`   ✅ Found ${figures.length} figures:`);
    figures.forEach((fig, idx) => {
      console.log(`      ${idx + 1}. ${fig.figure_number}: ${fig.caption.substring(0, 50)}...`);
      console.log(`         Shortcode: ${fig.shortcode}`);
    });
    
    return { found: true, figures };
  } catch (error: any) {
    console.error(`   ❌ Error:`, error.message);
    return { found: false, error: error.message, figures: [] };
  }
}

// Test cases
async function runTests() {
  console.log('🧪 Testing Image System\n');
  console.log('='.repeat(60));
  
  // Test 1: Chapter only
  await testGetChapterFigures('Chapter Six: Nutrition in plants');
  
  // Test 2: Chapter + topic (exact match)
  await testGetChapterFigures('Chapter Six: Nutrition in plants', 'The process of photosynthesis');
  
  // Test 3: Chapter + topic (syllabus name - should match flexibly)
  await testGetChapterFigures('Chapter Six: Nutrition in plants', 'Photosynthesis');
  
  // Test 4: Chapter + topic (another topic)
  await testGetChapterFigures('Chapter Six: Nutrition in plants', 'Structure of the leaf in relation to photosynthesis');
  
  // Test 5: Chapter One
  await testGetChapterFigures('Chapter One: Introduction to Biology');
  
  // Test 6: Chapter One + topic
  await testGetChapterFigures('Chapter One: Introduction to Biology', 'Importance of studying Biology');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!');
  console.log('\nExpected AI behavior:');
  console.log('1. AI should call get_chapter_figures with chapter and topic');
  console.log('2. Tool should return all matching figures');
  console.log('3. AI should include [image:shortcode] in response');
  console.log('4. Frontend should display images from image-shortcodes.json');
}

runTests().catch(console.error);







