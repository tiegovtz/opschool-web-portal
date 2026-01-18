/**
 * Script to sync URLs from /api/image-list to shortcodes in image-shortcodes.json
 * Requires the Nuxt server to be running (npm run dev)
 * Usage: npx tsx scripts/sync-urls-from-image-list.ts [AUTH_TOKEN]
 * 
 * To get your auth token:
 *   1. Log in to the app in your browser
 *   2. Open DevTools > Application > Cookies
 *   3. Copy the value of "signInAccessToken"
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const AUTH_TOKEN = process.argv[2] || process.env.AUTH_TOKEN || '';
const API_URL = 'http://localhost:3000/api/image-list?category=biology';

async function syncUrlsFromImageList() {
  try {
    console.log('[sync-urls] Starting to sync URLs from /api/image-list...');
    console.log(`[sync-urls] Fetching from: ${API_URL}`);
    
    const dataDir = join(process.cwd(), 'server', 'data');
    
    // Load figure-metadata.json
    const metadataPath = join(dataDir, 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    console.log(`[sync-urls] Loaded ${metadata.images.length} figures from figure-metadata.json`);
    
    // Load image-shortcodes.json
    const shortcodesPath = join(dataDir, 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const shortcodesData = JSON.parse(shortcodesContent);
    
    console.log(`[sync-urls] Loaded ${Object.keys(shortcodesData.shortcodes || {}).length} shortcodes from image-shortcodes.json`);
    
    // Build map from figure-metadata.json: figure_number -> { shortcode, caption }
    const figureMap = new Map<string, { shortcode: string; caption: string }>();
    for (const fig of metadata.images) {
      const figNum = fig.figure_number.replace(/^Figure\s*/i, '').trim();
      figureMap.set(figNum, {
        shortcode: fig.shortcode,
        caption: fig.caption
      });
    }
    
    // Fetch from /api/image-list
    let images: any[] = [];
    try {
      if (!AUTH_TOKEN) {
        console.log('[sync-urls] ⚠️ No auth token provided.');
        console.log('[sync-urls] Usage: npx tsx scripts/sync-urls-from-image-list.ts YOUR_AUTH_TOKEN');
        console.log('[sync-urls] To get your auth token:');
        console.log('   1. Log in to the app in your browser');
        console.log('   2. Open DevTools > Application > Cookies');
        console.log('   3. Copy the value of "signInAccessToken"');
        return;
      }
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cookie': `signInAccessToken=${AUTH_TOKEN}`,
        },
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API returned ${response.status}: ${text.substring(0, 200)}`);
      }
      
      const data = await response.json();
      images = data.images || [];
      console.log(`[sync-urls] Fetched ${images.length} images from /api/image-list`);
      
      if (data.total) {
        console.log(`[sync-urls] Total in API: ${data.total}, By category: ${JSON.stringify(data.byCategory)}`);
      }
    } catch (error: any) {
      console.error(`[sync-urls] Failed to fetch from API: ${error.message}`);
      console.log('[sync-urls] Make sure:');
      console.log('   1. The server is running (npm run dev)');
      console.log('   2. Your auth token is valid (from signInAccessToken cookie)');
      return;
    }
    
    // Match images to shortcodes by figure number
    let matchedCount = 0;
    
    for (const image of images) {
      if (!image.path) continue;
      
      // Try to extract figure number from description, alt, or shortcode
      const searchText = [
        image.description || '',
        image.alt || '',
        image.shortcode || ''
      ].join(' ').toLowerCase();
      
      // Match "Figure X.X" pattern
      const figureMatch = searchText.match(/figure\s*(\d+\.\d+)/i);
      
      if (figureMatch) {
        const figNum = figureMatch[1];
        const figInfo = figureMap.get(figNum);
        
        if (figInfo && shortcodesData.shortcodes[figInfo.shortcode]) {
          // Check caption match for better accuracy
          const captionWords = figInfo.caption.toLowerCase().split(/[^a-z]+/).filter((w: string) => w.length > 3);
          const descLower = (image.description || '').toLowerCase();
          const matchScore = captionWords.filter((word: string) => descLower.includes(word)).length;
          
          // Only update if this is a better match or no match yet
          const current = shortcodesData.shortcodes[figInfo.shortcode];
          if (!current.path || matchScore > 0) {
            shortcodesData.shortcodes[figInfo.shortcode].path = image.path;
            console.log(`[sync-urls] ✅ Matched Figure ${figNum} -> ${figInfo.shortcode}`);
            console.log(`   URL: ${image.path}`);
            console.log(`   Desc: ${(image.description || '').substring(0, 50)}`);
            matchedCount++;
          }
        }
      }
    }
    
    // Also update the images array
    for (const img of shortcodesData.images || []) {
      const sc = shortcodesData.shortcodes[img.shortcode];
      if (sc && sc.path) {
        img.path = sc.path;
      }
    }
    
    // Update timestamp
    shortcodesData.generatedAt = new Date().toISOString();
    
    // Save
    await writeFile(shortcodesPath, JSON.stringify(shortcodesData, null, 2), 'utf-8');
    
    console.log('');
    console.log(`[sync-urls] ✅ Matched ${matchedCount} URLs to shortcodes`);
    console.log(`[sync-urls] Updated image-shortcodes.json`);
    
    // Show status
    const withUrls = Object.values(shortcodesData.shortcodes).filter((s: any) => s.path).length;
    const withoutUrls = Object.values(shortcodesData.shortcodes).filter((s: any) => !s.path).length;
    console.log(`[sync-urls] Summary: ${withUrls} with URLs, ${withoutUrls} without URLs`);
    
    if (withoutUrls > 0) {
      const missing = Object.entries(shortcodesData.shortcodes)
        .filter(([_, s]: [string, any]) => !s.path)
        .map(([k, _]) => k);
      console.log(`[sync-urls] ⚠️ Missing URLs: ${missing.join(', ')}`);
    }
    
  } catch (error: any) {
    console.error('[sync-urls] Error:', error);
    throw error;
  }
}

// Run the script
syncUrlsFromImageList().catch(console.error);

export { syncUrlsFromImageList };
