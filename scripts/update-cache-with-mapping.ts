/**
 * Script to update figure-metadata.json and image-shortcodes.json
 * with the correct mappings from figure-url-mapping.json
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

async function updateCacheWithMapping() {
  try {
    console.log('[update-cache] Starting to update cache files with new mapping...');
    
    // Load the mapping file
    const mappingPath = join(process.cwd(), 'server', 'data', 'figure-url-mapping.json');
    const mappingContent = await readFile(mappingPath, 'utf-8');
    const mapping = JSON.parse(mappingContent);
    
    console.log(`[update-cache] Loaded mapping with ${mapping.figures.length} figures`);
    
    // Load figure-metadata.json
    const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    const figures = metadata.images || [];
    
    console.log(`[update-cache] Loaded ${figures.length} figures from figure-metadata.json`);
    
    // Load image-shortcodes.json
    const shortcodesPath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const shortcodesData = JSON.parse(shortcodesContent);
    const shortcodes = shortcodesData.shortcodes || {};
    
    console.log(`[update-cache] Loaded ${Object.keys(shortcodes).length} shortcodes from image-shortcodes.json`);
    
    // Create a map of figure_number + chapter + topic to mapping entry
    const mappingMap = new Map<string, any>();
    for (const mapEntry of mapping.figures) {
      const key = `${mapEntry.figure_number}|${mapEntry.chapter}|${mapEntry.topic}`;
      mappingMap.set(key, mapEntry);
    }
    
    // Update figure-metadata.json with correct shortcodes and URLs
    let metadataUpdated = 0;
    for (let i = 0; i < figures.length; i++) {
      const figure = figures[i];
      const key = `${figure.figure_number}|${figure.chapter}|${figure.topic}`;
      const mapEntry = mappingMap.get(key);
      
      if (mapEntry && mapEntry.matchType !== 'not_found' && mapEntry.url) {
        // Update shortcode if it's different
        if (figure.shortcode !== mapEntry.shortcode) {
          console.log(`[update-cache] Updating shortcode for ${figure.figure_number}: "${figure.shortcode}" → "${mapEntry.shortcode}"`);
          figures[i].shortcode = mapEntry.shortcode;
          metadataUpdated++;
        }
        
        // Note: We don't add URL to figure-metadata.json as per previous design
        // figure-metadata.json only contains shortcodes, not URLs
      }
    }
    
    // Save updated figure-metadata.json
    metadata.images = figures;
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`[update-cache] ✅ Updated ${metadataUpdated} shortcodes in figure-metadata.json`);
    
    // Ensure all matched shortcodes exist in image-shortcodes.json
    let shortcodesAdded = 0;
    let shortcodesUpdated = 0;
    
    for (const mapEntry of mapping.figures) {
      if (mapEntry.matchType !== 'not_found' && mapEntry.url && mapEntry.shortcode) {
        const shortcodeKey = mapEntry.shortcode;
        
        if (!shortcodes[shortcodeKey]) {
          // Add new shortcode entry
          shortcodes[shortcodeKey] = {
            path: mapEntry.url,
            alt: mapEntry.caption || `Figure ${mapEntry.figure_number}`,
            category: 'general', // Default category, can be improved
            description: mapEntry.caption,
            chapterName: mapEntry.chapter,
            topicName: mapEntry.topic,
            figureNumber: mapEntry.figure_number,
            figure_number: mapEntry.figure_number,
            caption: mapEntry.caption,
            pageNumber: mapEntry.page_number,
            page_number: mapEntry.page_number,
            searchableText: [
              shortcodeKey,
              mapEntry.caption,
              mapEntry.chapter,
              mapEntry.topic,
              mapEntry.figure_number
            ].filter(Boolean).join(' ')
          };
          shortcodesAdded++;
        } else {
          // Update existing shortcode if URL is different or missing
          const existing = shortcodes[shortcodeKey];
          if (existing.path !== mapEntry.url) {
            console.log(`[update-cache] Updating URL for ${shortcodeKey}: "${existing.path}" → "${mapEntry.url}"`);
            shortcodes[shortcodeKey].path = mapEntry.url;
            shortcodesUpdated++;
          }
          
          // Update metadata fields if missing
          if (!existing.chapterName && mapEntry.chapter) {
            shortcodes[shortcodeKey].chapterName = mapEntry.chapter;
          }
          if (!existing.topicName && mapEntry.topic) {
            shortcodes[shortcodeKey].topicName = mapEntry.topic;
          }
          if (!existing.caption && mapEntry.caption) {
            shortcodes[shortcodeKey].caption = mapEntry.caption;
          }
          if (!existing.figureNumber && !existing.figure_number && mapEntry.figure_number) {
            shortcodes[shortcodeKey].figureNumber = mapEntry.figure_number;
            shortcodes[shortcodeKey].figure_number = mapEntry.figure_number;
          }
          if (!existing.pageNumber && !existing.page_number && mapEntry.page_number) {
            shortcodes[shortcodeKey].pageNumber = mapEntry.page_number;
            shortcodes[shortcodeKey].page_number = mapEntry.page_number;
          }
        }
      }
    }
    
    // Update counts in shortcodes data
    const totalShortcodes = Object.keys(shortcodes).length;
    shortcodesData.total = totalShortcodes;
    shortcodesData.generatedAt = new Date().toISOString();
    
    // Update category counts
    const categoryCounts = {
      biology: 0,
      physics: 0,
      chemistry: 0,
      mathematics: 0,
      general: 0
    };
    
    for (const shortcode of Object.values(shortcodes) as any[]) {
      const category = shortcode.category || 'general';
      if (category in categoryCounts) {
        categoryCounts[category as keyof typeof categoryCounts]++;
      } else {
        categoryCounts.general++;
      }
    }
    
    shortcodesData.byCategory = categoryCounts;
    shortcodesData.shortcodes = shortcodes;
    
    // Save updated image-shortcodes.json
    await writeFile(shortcodesPath, JSON.stringify(shortcodesData, null, 2), 'utf-8');
    
    console.log(`[update-cache] ✅ Added ${shortcodesAdded} new shortcodes to image-shortcodes.json`);
    console.log(`[update-cache] ✅ Updated ${shortcodesUpdated} existing shortcodes in image-shortcodes.json`);
    console.log(`[update-cache] ✅ Total shortcodes in cache: ${totalShortcodes}`);
    console.log(`[update-cache] ✅ Cache update complete!`);
    
    // Summary
    const matchedCount = mapping.matched || 0;
    const notFoundCount = mapping.notFound || 0;
    
    console.log(`\n[update-cache] Summary:`);
    console.log(`  - Figures with URLs: ${matchedCount}`);
    console.log(`  - Figures without URLs: ${notFoundCount}`);
    console.log(`  - Shortcodes in cache: ${totalShortcodes}`);
    console.log(`  - Metadata updated: ${metadataUpdated}`);
    
  } catch (error: any) {
    console.error('[update-cache] Error:', error);
    throw error;
  }
}

// Run the script
updateCacheWithMapping().catch(console.error);

export { updateCacheWithMapping };


