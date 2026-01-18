/**
 * Script to remove embeddings from image-shortcodes.json
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

async function removeEmbeddings() {
  try {
    console.log('[remove-embeddings] Starting to remove embeddings from image-shortcodes.json...');
    
    // Load image-shortcodes.json
    const shortcodesPath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const data = JSON.parse(shortcodesContent);
    
    const shortcodes = data.shortcodes || {};
    console.log(`[remove-embeddings] Loaded ${Object.keys(shortcodes).length} shortcodes`);
    
    let removedCount = 0;
    
    // Remove embeddings from each shortcode
    for (const [shortcode, metadata] of Object.entries(shortcodes)) {
      const meta = metadata as any;
      if ('embedding' in meta) {
        delete meta.embedding;
        removedCount++;
      }
    }
    
    console.log(`[remove-embeddings] ✅ Removed embeddings from ${removedCount} shortcodes`);
    
    // Save updated file
    await writeFile(shortcodesPath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`[remove-embeddings] ✅ Successfully updated image-shortcodes.json`);
    console.log(`[remove-embeddings] File saved to: ${shortcodesPath}`);
    
  } catch (error: any) {
    console.error('[remove-embeddings] Error:', error);
    throw error;
  }
}

// Run the script
removeEmbeddings().catch(console.error);

export { removeEmbeddings };


