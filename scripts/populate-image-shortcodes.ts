/**
 * Script to populate image-shortcodes.json from figure-metadata.json
 * Uses figure-url-mapping.json to get URLs for each shortcode
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

async function populateImageShortcodes() {
  try {
    console.log('[populate-shortcodes] Starting to populate image-shortcodes.json...');
    
    // Load figure-metadata.json
    const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    console.log(`[populate-shortcodes] Loaded ${metadata.images.length} figures from figure-metadata.json`);
    
    // Load figure-url-mapping.json to get URLs
    let urlMapping: Record<string, any> = {};
    try {
      const mappingPath = join(process.cwd(), 'server', 'data', 'figure-url-mapping.json');
      const mappingContent = await readFile(mappingPath, 'utf-8');
      const mappingData = JSON.parse(mappingContent);
      
      // Create a map: figure_number -> url entry
      if (mappingData.figures && Array.isArray(mappingData.figures)) {
        for (const figure of mappingData.figures) {
          if (figure.figure_number && figure.url && figure.url !== 'not found') {
            // Use the primary URL from the mapping
            urlMapping[figure.figure_number] = {
              url: figure.url,
              urls: figure.urls || [figure.url],
              shortcodes: figure.shortcodes || []
            };
          }
        }
        console.log(`[populate-shortcodes] Loaded ${Object.keys(urlMapping).length} URL mappings from figure-url-mapping.json`);
      }
    } catch (error) {
      console.warn('[populate-shortcodes] Could not load figure-url-mapping.json, URLs will be empty:', (error as Error).message);
    }
    
    // Build shortcodes map from figure-metadata.json
    const shortcodeMap: Record<string, {
      path: string;
      alt: string;
      category: string;
      description?: string;
      chapterName?: string;
      topicName?: string;
      subjectName?: string;
      searchableText: string;
    }> = {};
    
    const images: Array<{
      path: string;
      alt: string;
      shortcode: string;
      category: string;
      description?: string;
      chapterName?: string;
      topicName?: string;
    }> = [];
    
    for (const image of metadata.images) {
      if (!image.shortcode) {
        console.warn(`[populate-shortcodes] ⚠️ Skipping ${image.figure_number} - no shortcode found`);
        continue;
      }
      
      // Get URL from mapping (use first URL if multiple available)
      const urlEntry = urlMapping[image.figure_number];
      const path = urlEntry?.url || '';
      
      // Determine category (default to biology based on current data)
      const category = 'biology';
      
      // Create searchable text
      const searchableText = [
        image.shortcode,
        image.figure_number,
        image.caption || '',
        image.description || '',
        image.chapter || '',
        image.topic || ''
      ].filter(Boolean).join(' ');
      
      // Build metadata entry
      shortcodeMap[image.shortcode] = {
        path: path,
        alt: image.caption || image.figure_number,
        category: category,
        description: image.description || image.caption,
        chapterName: image.chapter,
        topicName: image.topic,
        subjectName: 'Biology',
        searchableText: searchableText,
      };
      
      // Also add to images array for completeness
      images.push({
        path: path,
        alt: image.caption || image.figure_number,
        shortcode: image.shortcode,
        category: category,
        description: image.description || image.caption,
        chapterName: image.chapter,
        topicName: image.topic,
      });
      
      console.log(`[populate-shortcodes] ✅ Added shortcode: ${image.shortcode} → ${path || '(no URL - not found in mapping)'}`);
    }
    
    // Prepare data structure matching image-list.ts format
    const data = {
      generatedAt: new Date().toISOString(),
      total: images.length,
      byCategory: {
        biology: images.filter((img) => img.category === 'biology').length,
        physics: 0,
        chemistry: 0,
        mathematics: 0,
        geography: 0,
        horticulture: 0,
        english: 0,
        'leather-goods': 0,
      },
      shortcodes: shortcodeMap,
      images: images, // Full image list for reference
    };
    
    // Ensure directory exists
    const dataDir = join(process.cwd(), 'server', 'data');
    await mkdir(dataDir, { recursive: true });
    
    // Write to file
    const filePath = join(dataDir, 'image-shortcodes.json');
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`[populate-shortcodes] ✅ Saved ${Object.keys(shortcodeMap).length} shortcodes to ${filePath}`);
    console.log(`[populate-shortcodes] Summary:`);
    console.log(`  - Total shortcodes: ${Object.keys(shortcodeMap).length}`);
    console.log(`  - With URLs: ${Object.values(shortcodeMap).filter(s => s.path).length}`);
    console.log(`  - Without URLs: ${Object.values(shortcodeMap).filter(s => !s.path).length}`);
    
  } catch (error: any) {
    console.error('[populate-shortcodes] Error:', error);
    throw error;
  }
}

// Run the script
populateImageShortcodes().catch(console.error);

export { populateImageShortcodes };










