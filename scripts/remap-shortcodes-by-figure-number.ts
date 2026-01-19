import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

interface FigureMetadata {
  chapter: string;
  topic: string;
  figure_number: string;
  caption: string;
  page_number: number;
  shortcode?: string;
  path?: string;
  subjectId?: string;
}

interface ImageShortcode {
  path: string;
  alt: string;
  category: string;
  description?: string;
  figureNumber?: string;
  figure_number?: string;
  subjectId?: string;
  [key: string]: any;
}

// Biology subject ID
const BIOLOGY_SUBJECT_ID = '6658658d7b076d51f6fc0381';

async function remapShortcodesByFigureNumber() {
  try {
    console.log('[remap-shortcodes] Starting to remap shortcodes by exact figure number match...');
    
    // Load figure-metadata.json
    const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Load image-shortcodes.json
    const shortcodesPath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const shortcodesData = JSON.parse(shortcodesContent);
    const shortcodes = shortcodesData.shortcodes || {};
    
    console.log(`[remap-shortcodes] Loaded ${metadata.images.length} figures from figure-metadata.json`);
    console.log(`[remap-shortcodes] Loaded ${Object.keys(shortcodes).length} shortcodes from image-shortcodes.json`);
    
    // Create a map: figure_number -> shortcode entry (ONLY from biology subject)
    const figureNumberToShortcode = new Map<string, { shortcode: string; path: string; metadata: ImageShortcode }>();
    
    for (const [shortcode, meta] of Object.entries(shortcodes)) {
      const shortcodeMeta = meta as ImageShortcode;
      
      // Only include entries with biology subject ID
      if (shortcodeMeta.subjectId === BIOLOGY_SUBJECT_ID) {
        const figureNumber = shortcodeMeta.figure_number || shortcodeMeta.figureNumber;
        
        if (figureNumber && typeof figureNumber === 'string') {
          // Use exact figure number as key (e.g., "Figure 1.1")
          const normalizedFigureNumber = figureNumber.trim();
          
          // If multiple shortcodes have the same figure number, prefer ones with more metadata
          if (!figureNumberToShortcode.has(normalizedFigureNumber) || 
              (shortcodeMeta.description && !figureNumberToShortcode.get(normalizedFigureNumber)?.metadata.description)) {
            figureNumberToShortcode.set(normalizedFigureNumber, {
              shortcode,
              path: shortcodeMeta.path,
              metadata: shortcodeMeta
            });
          }
        }
      }
    }
    
    console.log(`[remap-shortcodes] Created map with ${figureNumberToShortcode.size} biology figure numbers`);
    
    let matchedCount = 0;
    let unmatchedCount = 0;
    const unmatchedFigures: string[] = [];
    
    // Update figure-metadata.json with matched shortcodes and paths
    for (const figure of metadata.images as FigureMetadata[]) {
      const figureNumber = figure.figure_number?.trim();
      
      if (figureNumber && figureNumberToShortcode.has(figureNumber)) {
        const match = figureNumberToShortcode.get(figureNumber)!;
        figure.shortcode = match.shortcode;
        figure.path = match.path;
        // Don't set subjectId - just ensure we're mapping from biology entries
        matchedCount++;
      } else {
        unmatchedCount++;
        if (figureNumber) {
          unmatchedFigures.push(`${figure.figure_number} - ${figure.caption}`);
        }
      }
    }
    
    console.log(`[remap-shortcodes] ✅ Matched ${matchedCount} figures`);
    console.log(`[remap-shortcodes] ❌ Unmatched ${unmatchedCount} figures`);
    
    if (unmatchedFigures.length > 0 && unmatchedFigures.length <= 10) {
      console.log(`[remap-shortcodes] Unmatched figures (first 10):`);
      unmatchedFigures.slice(0, 10).forEach(fig => console.log(`  - ${fig}`));
    } else if (unmatchedFigures.length > 10) {
      console.log(`[remap-shortcodes] Unmatched figures (first 10 of ${unmatchedFigures.length}):`);
      unmatchedFigures.slice(0, 10).forEach(fig => console.log(`  - ${fig}`));
    }
    
    // Save updated figure-metadata.json
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`[remap-shortcodes] ✅ Updated figure-metadata.json with ${matchedCount} remapped shortcodes`);
    
  } catch (error: any) {
    console.error('[remap-shortcodes] ❌ Error:', error);
    throw error;
  }
}

// Run the script
remapShortcodesByFigureNumber()
  .then(() => {
    console.log('[remap-shortcodes] ✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[remap-shortcodes] ❌ Script failed:', error);
    process.exit(1);
  });

