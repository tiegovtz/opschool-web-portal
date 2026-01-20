/**
 * Script to map shortcodes in figure-metadata.json to actual image URLs from image-shortcodes.json
 * Matches by: shortcode name, chapter/topic/figure number, or caption similarity
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

function normalizeChapter(chapter: string): string {
  return chapter.toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeTopic(topic: string): string {
  return topic.toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeFigureNumber(figureNumber: string): string {
  return figureNumber.toLowerCase().trim().replace(/\s+/g, '');
}

function similarityScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

async function mapShortcodesToUrls() {
  try {
    console.log('[map-shortcodes] Starting to map shortcodes to image URLs...');
    
    // Load figure-metadata.json
    const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Load image-shortcodes.json
    const shortcodesPath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const shortcodesData = JSON.parse(shortcodesContent);
    const shortcodes = shortcodesData.shortcodes || {};
    
    console.log(`[map-shortcodes] Loaded ${metadata.images.length} figures from figure-metadata.json`);
    console.log(`[map-shortcodes] Loaded ${Object.keys(shortcodes).length} shortcodes from image-shortcodes.json`);
    
    let exactMatchCount = 0;
    let fuzzyMatchCount = 0;
    let noMatchCount = 0;
    const noMatches: string[] = [];
    
    // Create lookup maps for faster matching
    const shortcodeMap = new Map<string, any>();
    const chapterTopicFigureMap = new Map<string, any>();
    
    // Build shortcode lookup
    for (const [shortcode, meta] of Object.entries(shortcodes)) {
      shortcodeMap.set(shortcode.toLowerCase(), { shortcode, path: (meta as any).path, metadata: meta });
    }
    
    // Build chapter/topic/figure lookup
    for (const [shortcode, meta] of Object.entries(shortcodes)) {
      const metaData = meta as any;
      const chapter = normalizeChapter(metaData.chapterName || metaData.chapter || '');
      const topic = normalizeTopic(metaData.topicName || metaData.topic || '');
      const figure = normalizeFigureNumber(metaData.figureNumber || metaData.figure_number || '');
      
      if (chapter && topic && figure) {
        const key = `${chapter}|${topic}|${figure}`;
        chapterTopicFigureMap.set(key, { shortcode, path: metaData.path, metadata: metaData });
      }
    }
    
    // Map shortcodes to URLs
    for (const image of metadata.images) {
      // Skip if already has path
      if (image.path || image.simulationFileUrl) {
        continue;
      }
      
      const imageShortcode = (image.shortcode || '').toLowerCase();
      const imageChapter = normalizeChapter(image.chapter);
      const imageTopic = normalizeTopic(image.topic);
      const imageFigure = normalizeFigureNumber(image.figure_number);
      
      let matchedPath: string | null = null;
      let matchType = '';
      
      // Method 1: Exact shortcode match
      if (imageShortcode) {
        const exactMatch = shortcodeMap.get(imageShortcode);
        if (exactMatch) {
          matchedPath = exactMatch.path;
          matchType = 'exact_shortcode';
          exactMatchCount++;
          console.log(`[map-shortcodes] ✅ Exact shortcode match: ${image.figure_number} → ${matchedPath}`);
        }
      }
      
      // Method 2: Chapter/topic/figure number match
      if (!matchedPath && imageChapter && imageTopic && imageFigure) {
        const key = `${imageChapter}|${imageTopic}|${imageFigure}`;
        const match = chapterTopicFigureMap.get(key);
        if (match) {
          matchedPath = match.path;
          matchType = 'chapter_topic_figure';
          fuzzyMatchCount++;
          console.log(`[map-shortcodes] ✅ Chapter/topic/figure match: ${image.figure_number} → ${matchedPath}`);
        }
      }
      
      // Method 3: Match by figure number in description/caption (most reliable)
      if (!matchedPath && imageFigure) {
        // Extract figure number pattern (e.g., "6.3" from "Figure 6.3")
        const figureNumPattern = imageFigure.replace(/figure\s*/i, '').trim();
        
        for (const [shortcode, meta] of Object.entries(shortcodes)) {
          const metaData = meta as any;
          const description = (metaData.description || '').toLowerCase();
          const caption = (metaData.caption || '').toLowerCase();
          const alt = (metaData.alt || '').toLowerCase();
          const searchableText = (metaData.searchableText || '').toLowerCase();
          
          // Check if figure number appears in any text field
          const combinedText = `${description} ${caption} ${alt} ${searchableText}`;
          
          if (combinedText.includes(figureNumPattern) || combinedText.includes(imageFigure)) {
            // Also check chapter/topic if available
            const metaChapter = normalizeChapter(metaData.chapterName || metaData.chapter || '');
            const metaTopic = normalizeTopic(metaData.topicName || metaData.topic || '');
            
            let match = false;
            
            // If we have chapter/topic context, prefer matches that align
            if (imageChapter && imageTopic) {
              if (metaChapter && metaTopic) {
                // Both have chapter/topic - check alignment
                const chapterMatch = similarityScore(metaChapter, imageChapter) > 0.7;
                const topicMatch = similarityScore(metaTopic, imageTopic) > 0.7;
                if (chapterMatch && topicMatch) {
                  match = true;
                }
              } else {
                // Meta doesn't have chapter/topic, but figure number matches - still use it
                match = true;
              }
            } else {
              // No chapter/topic context, just match by figure number
              match = true;
            }
            
            if (match) {
              matchedPath = metaData.path;
              matchType = 'figure_number_in_text';
              fuzzyMatchCount++;
              console.log(`[map-shortcodes] ✅ Figure number match: ${image.figure_number} → ${matchedPath} (from ${shortcode})`);
              break; // Found a match, stop searching
            }
          }
        }
      }
      
      // Method 4: Fuzzy matching by chapter/topic/caption (fallback)
      if (!matchedPath) {
        let bestMatch: { path: string; score: number } | null = null;
        
        for (const [shortcode, meta] of Object.entries(shortcodes)) {
          const metaData = meta as any;
          const metaChapter = normalizeChapter(metaData.chapterName || metaData.chapter || '');
          const metaTopic = normalizeTopic(metaData.topicName || metaData.topic || '');
          const metaCaption = (metaData.caption || metaData.description || '').toLowerCase();
          const imageCaption = (image.caption || '').toLowerCase();
          
          let score = 0;
          
          // Chapter match
          if (metaChapter && imageChapter) {
            const chapterScore = similarityScore(metaChapter, imageChapter);
            score += chapterScore * 0.3;
          }
          
          // Topic match
          if (metaTopic && imageTopic) {
            const topicScore = similarityScore(metaTopic, imageTopic);
            score += topicScore * 0.3;
          }
          
          // Caption match
          if (metaCaption && imageCaption) {
            const captionScore = similarityScore(metaCaption, imageCaption);
            score += captionScore * 0.4;
          }
          
          // Require minimum score of 0.7 for fuzzy match (higher threshold)
          if (score > 0.7 && score > (bestMatch?.score || 0)) {
            bestMatch = { path: metaData.path, score };
          }
        }
        
        if (bestMatch) {
          matchedPath = bestMatch.path;
          matchType = 'fuzzy_match';
          fuzzyMatchCount++;
          console.log(`[map-shortcodes] ✅ Fuzzy match (score: ${bestMatch.score.toFixed(2)}): ${image.figure_number} → ${matchedPath}`);
        }
      }
      
      // Add path to image entry
      if (matchedPath) {
        image.path = matchedPath;
        image.simulationFileUrl = matchedPath; // Also add as simulationFileUrl for compatibility
        image.matchType = matchType;
      } else {
        noMatchCount++;
        noMatches.push(`${image.figure_number} (${image.caption?.substring(0, 40)}...) - shortcode: ${image.shortcode}`);
        console.log(`[map-shortcodes] ⚠️ No match found: ${image.figure_number} - shortcode: ${image.shortcode}`);
      }
    }
    
    console.log(`[map-shortcodes] ✅ Exact shortcode matches: ${exactMatchCount}`);
    console.log(`[map-shortcodes] ✅ Chapter/topic/figure matches: ${fuzzyMatchCount}`);
    console.log(`[map-shortcodes] ⚠️ No matches found: ${noMatchCount}`);
    
    if (noMatches.length > 0) {
      console.log(`[map-shortcodes] ⚠️ Unmatched figures:`, noMatches.slice(0, 5));
    }
    
    // Save updated figure-metadata.json
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    
    console.log(`[map-shortcodes] ✅ Successfully updated figure-metadata.json with image URLs`);
    console.log(`[map-shortcodes] File saved to: ${metadataPath}`);
    
  } catch (error: any) {
    console.error('[map-shortcodes] Error:', error);
    throw error;
  }
}

// Run the script
mapShortcodesToUrls().catch(console.error);

export { mapShortcodesToUrls };

