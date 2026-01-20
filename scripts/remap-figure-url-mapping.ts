import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

interface FigureUrlMapping {
  generatedAt: string;
  total: number;
  matched: number;
  notFound: number;
  matchBreakdown: {
    exact_shortcode: number;
    figure_number: number;
    chapter_caption: number;
    not_found: number;
  };
  figures: Array<{
    figure_number: string;
    caption: string;
    chapter: string;
    topic: string;
    page_number: number;
    shortcode: string;
    url: string;
    urls?: string[];
    shortcodes?: string[];
    matchType: string;
    confidence: number;
  }>;
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

async function remapFigureUrlMapping() {
  try {
    console.log('[remap-mapping] Starting to remap figure-url-mapping.json by exact figure number match (biology only)...');
    
    // Load figure-url-mapping.json
    const mappingPath = join(process.cwd(), 'server', 'data', 'figure-url-mapping.json');
    const mappingContent = await readFile(mappingPath, 'utf-8');
    const mapping: FigureUrlMapping = JSON.parse(mappingContent);
    
    // Load image-shortcodes.json
    const shortcodesPath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const shortcodesData = JSON.parse(shortcodesContent);
    const shortcodes = shortcodesData.shortcodes || {};
    
    console.log(`[remap-mapping] Loaded ${mapping.figures.length} figures from figure-url-mapping.json`);
    console.log(`[remap-mapping] Loaded ${Object.keys(shortcodes).length} shortcodes from image-shortcodes.json`);
    
    // Create a map: figure_number -> array of shortcode entries (ONLY from biology subject)
    // A figure can have multiple URLs (e.g., Figure 1.1 has parts a, b, c, d)
    const figureNumberToShortcodes = new Map<string, Array<{ shortcode: string; path: string; metadata: ImageShortcode }>>();
    
    for (const [shortcode, meta] of Object.entries(shortcodes)) {
      const shortcodeMeta = meta as ImageShortcode;
      
      // Check if this is a biology entry by subjectId, category, or subjectName
      const isBiology = 
        shortcodeMeta.subjectId === BIOLOGY_SUBJECT_ID ||
        shortcodeMeta.category?.toLowerCase() === 'biology' ||
        shortcodeMeta.subjectName?.toLowerCase() === 'biology';
      
      // Only include entries with biology subject
      if (isBiology) {
        // Try to extract figure number from multiple fields
        let figureNumber = shortcodeMeta.figure_number || shortcodeMeta.figureNumber;
        
        // If not found, extract from description, alt, or searchableText
        if (!figureNumber || typeof figureNumber !== 'string') {
          const searchFields = [
            shortcodeMeta.description,
            shortcodeMeta.alt,
            shortcodeMeta.searchableText
          ].filter(Boolean).join(' ');
          
          // Extract figure number pattern (e.g., "Figure 1.1 a" or "Figure 1.1")
          const figureMatch = searchFields.match(/Figure\s+\d+\.\d+(\s+[a-z])?/i);
          if (figureMatch) {
            figureNumber = figureMatch[0].trim();
          }
        }
        
        if (figureNumber && typeof figureNumber === 'string') {
          // Normalize: extract base figure number (e.g., "Figure 1.1 a" -> "Figure 1.1")
          // This allows "Figure 1.1" to match "Figure 1.1 a", "Figure 1.1 b", etc.
          const normalizedFigureNumber = figureNumber.replace(/\s+[a-z]$/i, '').trim();
          
          // Add to array - a figure can have multiple URLs
          if (!figureNumberToShortcodes.has(normalizedFigureNumber)) {
            figureNumberToShortcodes.set(normalizedFigureNumber, []);
          }
          
          figureNumberToShortcodes.get(normalizedFigureNumber)!.push({
            shortcode,
            path: shortcodeMeta.path,
            metadata: shortcodeMeta
          });
        }
      }
    }
    
    console.log(`[remap-mapping] Created map with ${figureNumberToShortcodes.size} biology figure numbers`);
    
    let matchedCount = 0;
    let unmatchedCount = 0;
    const unmatchedFigures: string[] = [];
    
    // Update figure-url-mapping.json with matched URLs and shortcodes
    for (const figure of mapping.figures) {
      const figureNumber = figure.figure_number?.trim();
      
      if (figureNumber) {
        // Try exact match first
        let matches: Array<{ shortcode: string; path: string; metadata: ImageShortcode }> | undefined = 
          figureNumberToShortcodes.get(figureNumber);
        
        // If no exact match, try prefix matching (e.g., "Figure 1.1" should match "Figure 1.1a", "Figure 1.1b", etc.)
        if (!matches || matches.length === 0) {
          // Normalize figure number (remove spaces, make consistent)
          const normalizedBase = figureNumber.toLowerCase().replace(/\s+/g, ' ');
          
          // Find all entries that start with the base figure number (e.g., "figure 1.1" matches "figure 1.1a")
          matches = [];
          for (const [mappedFigureNumber, mappedMatches] of figureNumberToShortcodes.entries()) {
            const normalizedMapped = mappedFigureNumber.toLowerCase().replace(/\s+/g, ' ');
            
            // Check if mapped figure number starts with base figure number
            // e.g., "figure 1.1" matches "figure 1.1a", "figure 1.1b", etc.
            // but also matches "figure 1.1" exactly
            if (normalizedMapped.startsWith(normalizedBase)) {
              // Verify it's not a false match (e.g., "Figure 1.1" shouldn't match "Figure 1.10")
              // Check if the next character after the base is a letter (a-z) or nothing/space
              const remaining = normalizedMapped.substring(normalizedBase.length).trim();
              if (remaining === '' || /^[a-z]$/.test(remaining.charAt(0))) {
                matches.push(...mappedMatches);
              }
            }
          }
        }
        
        if (matches && matches.length > 0) {
          // Store all URLs and shortcodes for this figure
          const allUrls = matches.map(m => m.path);
          const allShortcodes = matches.map(m => m.shortcode);
          
          // Use the first one as primary for backward compatibility
          const primaryMatch = matches[0];
          figure.shortcode = primaryMatch.shortcode;
          figure.url = primaryMatch.path;
          
          // Store all URLs and shortcodes if there are multiple
          if (matches.length > 1) {
            figure.urls = allUrls;
            figure.shortcodes = allShortcodes;
            console.log(`[remap-mapping] ✅ Figure ${figureNumber} has ${matches.length} URLs: ${allShortcodes.join(', ')}`);
          }
          
          figure.matchType = 'figure_number';
          figure.confidence = 1.0;
          matchedCount++;
        } else {
          // Not found - set URL to "not found"
          figure.url = 'not found';
          figure.matchType = 'not_found';
          figure.confidence = 0;
          unmatchedCount++;
          unmatchedFigures.push(`${figure.figure_number} - ${figure.caption}`);
        }
      } else {
        // No figure number - set to not found
        figure.url = 'not found';
        figure.matchType = 'not_found';
        figure.confidence = 0;
        unmatchedCount++;
      }
    }
    
    // Update statistics
    mapping.matched = matchedCount;
    mapping.notFound = unmatchedCount;
    mapping.matchBreakdown.figure_number = matchedCount;
    mapping.matchBreakdown.not_found = unmatchedCount;
    mapping.matchBreakdown.exact_shortcode = 0;
    mapping.matchBreakdown.chapter_caption = 0;
    mapping.generatedAt = new Date().toISOString();
    
    console.log(`[remap-mapping] ✅ Matched ${matchedCount} figures`);
    console.log(`[remap-mapping] ❌ Unmatched ${unmatchedCount} figures`);
    
    if (unmatchedFigures.length > 0 && unmatchedFigures.length <= 10) {
      console.log(`[remap-mapping] Unmatched figures (first 10):`);
      unmatchedFigures.slice(0, 10).forEach(fig => console.log(`  - ${fig}`));
    } else if (unmatchedFigures.length > 10) {
      console.log(`[remap-mapping] Unmatched figures (first 10 of ${unmatchedFigures.length}):`);
      unmatchedFigures.slice(0, 10).forEach(fig => console.log(`  - ${fig}`));
    }
    
    // Save updated figure-url-mapping.json
    await writeFile(mappingPath, JSON.stringify(mapping, null, 2), 'utf-8');
    console.log(`[remap-mapping] ✅ Updated figure-url-mapping.json with ${matchedCount} remapped URLs`);
    
  } catch (error: any) {
    console.error('[remap-mapping] ❌ Error:', error);
    throw error;
  }
}

// Run the script
remapFigureUrlMapping()
  .then(() => {
    console.log('[remap-mapping] ✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[remap-mapping] ❌ Script failed:', error);
    process.exit(1);
  });

