/**
 * Script to replace image-shortcodes.json with only the figures from figure-metadata.json
 * Maps each shortcode from figure-metadata.json to its URL from the existing image-shortcodes.json
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

async function replaceImageShortcodesWithFigures() {
  try {
    console.log('[replace-shortcodes] Starting to replace image-shortcodes.json with figure metadata...');
    
    // Load figure-metadata.json
    const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Load existing image-shortcodes.json to get URLs
    const shortcodesPath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const existingShortcodesData = JSON.parse(shortcodesContent);
    const existingShortcodes = existingShortcodesData.shortcodes || {};
    
    console.log(`[replace-shortcodes] Loaded ${metadata.images.length} figures from figure-metadata.json`);
    console.log(`[replace-shortcodes] Loaded ${Object.keys(existingShortcodes).length} existing shortcodes`);
    
    // Build new shortcodes object with only figures from figure-metadata.json
    const newShortcodes: Record<string, any> = {};
    let foundCount = 0;
    let notFoundCount = 0;
    const notFound: string[] = [];
    
    for (const image of metadata.images) {
      const shortcode = image.shortcode;
      
      if (!shortcode) {
        console.log(`[replace-shortcodes] ⚠️ No shortcode for ${image.figure_number}`);
        notFoundCount++;
        continue;
      }
      
      // Look up the shortcode in existing image-shortcodes.json
      const existingShortcode = existingShortcodes[shortcode];
      
      if (existingShortcode) {
        // Use the existing shortcode entry (has path, alt, category, etc.)
        newShortcodes[shortcode] = {
          path: existingShortcode.path,
          alt: existingShortcode.alt || image.caption || `Figure ${image.figure_number}`,
          category: existingShortcode.category || 'biology',
          description: existingShortcode.description || image.caption,
          chapterName: image.chapter || existingShortcode.chapterName,
          topicName: image.topic || existingShortcode.topicName,
          subjectName: existingShortcode.subjectName || 'Biology',
          figureNumber: image.figure_number || existingShortcode.figureNumber || existingShortcode.figure_number,
          figure_number: image.figure_number || existingShortcode.figure_number,
          caption: image.caption || existingShortcode.caption,
          pageNumber: image.page_number || existingShortcode.pageNumber || existingShortcode.page_number,
          page_number: image.page_number || existingShortcode.page_number,
          // Preserve embedding if it exists
          embedding: existingShortcode.embedding,
          // Preserve searchableText if it exists, or generate new one
          searchableText: existingShortcode.searchableText || [
            shortcode,
            image.caption || '',
            image.chapter || '',
            image.topic || '',
            image.figure_number || ''
          ].filter(Boolean).join(' ')
        };
        foundCount++;
        console.log(`[replace-shortcodes] ✅ Found: ${shortcode} → ${existingShortcode.path}`);
      } else {
        notFoundCount++;
        notFound.push(`${image.figure_number} - ${shortcode}`);
        console.log(`[replace-shortcodes] ⚠️ Shortcode not found in existing file: ${shortcode}`);
      }
    }
    
    console.log(`[replace-shortcodes] ✅ Found ${foundCount} shortcodes with URLs`);
    console.log(`[replace-shortcodes] ⚠️ ${notFoundCount} shortcodes not found in existing file`);
    
    if (notFound.length > 0) {
      console.log(`[replace-shortcodes] ⚠️ Missing shortcodes:`, notFound.slice(0, 10));
    }
    
    // Count by category
    const byCategory: Record<string, number> = {
      biology: 0,
      physics: 0,
      chemistry: 0,
      mathematics: 0,
      general: 0
    };
    
    for (const shortcodeData of Object.values(newShortcodes)) {
      const category = (shortcodeData as any).category || 'general';
      byCategory[category] = (byCategory[category] || 0) + 1;
    }
    
    // Create new image-shortcodes.json structure
    const newData = {
      generatedAt: new Date().toISOString(),
      total: Object.keys(newShortcodes).length,
      byCategory: byCategory,
      shortcodes: newShortcodes
    };
    
    // Backup existing file
    const backupPath = join(process.cwd(), 'server', 'data', `image-shortcodes.backup.${Date.now()}.json`);
    await writeFile(backupPath, shortcodesContent, 'utf-8');
    console.log(`[replace-shortcodes] 📦 Created backup: ${backupPath}`);
    
    // Write new file
    await writeFile(shortcodesPath, JSON.stringify(newData, null, 2), 'utf-8');
    
    console.log(`[replace-shortcodes] ✅ Successfully replaced image-shortcodes.json`);
    console.log(`[replace-shortcodes] New file contains ${Object.keys(newShortcodes).length} shortcodes`);
    console.log(`[replace-shortcodes] File saved to: ${shortcodesPath}`);
    
  } catch (error: any) {
    console.error('[replace-shortcodes] Error:', error);
    throw error;
  }
}

// Run the script
replaceImageShortcodesWithFigures().catch(console.error);

export { replaceImageShortcodesWithFigures };












