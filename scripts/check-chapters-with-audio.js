/**
 * Script to check which chapters have audio files
 * 
 * Usage:
 *   node scripts/check-chapters-with-audio.js
 * 
 * Environment variables:
 *   VITE_API_BASE_URL - The base URL of the API (required)
 *   AUTH_TOKEN - Authentication token (optional, will prompt if not set)
 */

const BASE_URL = process.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.error('Error: VITE_API_BASE_URL environment variable is required');
  console.log('Example: VITE_API_BASE_URL=https://your-api.com/v1 node scripts/check-chapters-with-audio.js');
  process.exit(1);
}

const TOKEN = process.env.AUTH_TOKEN;

async function fetchWithAuth(endpoint) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (TOKEN) {
    headers['Authorization'] = `Bearer ${TOKEN}`;
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, { headers });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function checkChaptersWithAudio() {
  console.log('🔍 Fetching chapters from API...');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Token: ${TOKEN ? '✓ Provided' : '✗ Not provided'}\n`);
  
  try {
    // Try to fetch all chapters
    const chapters = await fetchWithAuth('/chapters');
    
    if (!Array.isArray(chapters)) {
      console.log('Response is not an array. Full response:');
      console.log(JSON.stringify(chapters, null, 2));
      return;
    }
    
    console.log(`📚 Found ${chapters.length} total chapters\n`);
    
    // Categorize chapters
    const withAudio = [];
    const withoutAudio = [];
    
    for (const chapter of chapters) {
      const audioCount = chapter.audios?.length || 0;
      
      if (audioCount > 0) {
        withAudio.push({
          id: chapter._id,
          name: chapter.name,
          chapterNo: chapter.chapterNo,
          audioCount,
          audios: chapter.audios?.map(a => ({
            id: a._id,
            name: a.name,
            type: a.audioType,
          }))
        });
      } else {
        withoutAudio.push({
          id: chapter._id,
          name: chapter.name,
          chapterNo: chapter.chapterNo,
        });
      }
    }
    
    // Display results
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🎵 CHAPTERS WITH AUDIO (${withAudio.length})`);
    console.log('═══════════════════════════════════════════════════════════');
    
    if (withAudio.length === 0) {
      console.log('   No chapters have audio files yet.\n');
    } else {
      withAudio.forEach((ch, idx) => {
        console.log(`\n${idx + 1}. ${ch.name}`);
        console.log(`   ID: ${ch.id}`);
        console.log(`   Chapter No: ${ch.chapterNo || 'N/A'}`);
        console.log(`   Audio Files: ${ch.audioCount}`);
        if (ch.audios) {
          ch.audios.forEach(audio => {
            console.log(`     - ${audio.name || audio.id} (${audio.type || 'unknown type'})`);
          });
        }
      });
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📭 CHAPTERS WITHOUT AUDIO (${withoutAudio.length})`);
    console.log('═══════════════════════════════════════════════════════════');
    
    if (withoutAudio.length === 0) {
      console.log('   All chapters have audio!\n');
    } else if (withoutAudio.length > 20) {
      // Show first 10 and last 5 if there are many
      console.log('   (Showing first 10 and last 5...)\n');
      withoutAudio.slice(0, 10).forEach((ch, idx) => {
        console.log(`   ${idx + 1}. ${ch.name} (ID: ${ch.id})`);
      });
      console.log('   ...');
      withoutAudio.slice(-5).forEach((ch, idx) => {
        console.log(`   ${withoutAudio.length - 4 + idx}. ${ch.name} (ID: ${ch.id})`);
      });
      console.log('');
    } else {
      withoutAudio.forEach((ch, idx) => {
        console.log(`   ${idx + 1}. ${ch.name} (ID: ${ch.id})`);
      });
      console.log('');
    }
    
    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Total Chapters:        ${chapters.length}`);
    console.log(`   With Audio:            ${withAudio.length} (${((withAudio.length / chapters.length) * 100).toFixed(1)}%)`);
    console.log(`   Without Audio:         ${withoutAudio.length} (${((withoutAudio.length / chapters.length) * 100).toFixed(1)}%)`);
    console.log(`   Total Audio Files:     ${withAudio.reduce((sum, ch) => sum + ch.audioCount, 0)}`);
    console.log('');
    
    return { withAudio, withoutAudio, total: chapters.length };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n💡 Tip: You may need to provide an AUTH_TOKEN environment variable');
      console.log('   Example: AUTH_TOKEN=your_token node scripts/check-chapters-with-audio.js');
    }
    
    process.exit(1);
  }
}

// Run the script
checkChaptersWithAudio();

