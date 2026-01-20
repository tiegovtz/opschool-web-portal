/**
 * Script to ensure shortcodes in figure-metadata.json match the exact format
 * of shortcodes that exist in image-shortcodes.json
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

async function fixShortcodeFormat() {
  try {
    console.log('[fix-format] Starting to fix shortcode format in figure-metadata.json...');
    
    // Load figure-metadata.json
    const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Load image-shortcodes.json to get actual shortcode formats
    const shortcodesPath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const shortcodesData = JSON.parse(shortcodesContent);
    const shortcodes = shortcodesData.shortcodes || {};
    
    console.log(`[fix-format] Loaded ${metadata.images.length} figures from figure-metadata.json`);
    console.log(`[fix-format] Loaded ${Object.keys(shortcodes).length} shortcodes from image-shortcodes.json`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    const notFound: string[] = [];
    
    // Build lookup maps
    const figureNumberMap = new Map<string, Array<{ shortcode: string; metadata: any; score: number }>>();
    
    // Index shortcodes by figure number
    for (const [shortcode, meta] of Object.entries(shortcodes)) {
      const metaData = meta as any;
      const description = (metaData.description || '').toLowerCase();
      const caption = (metaData.caption || '').toLowerCase();
      const alt = (metaData.alt || '').toLowerCase();
      const searchableText = (metaData.searchableText || '').toLowerCase();
      
      const combinedText = `${description} ${caption} ${alt} ${searchableText}`;
      const figureMatches = combinedText.match(/figure\s*(\d+\.\d+)/gi);
      
      if (figureMatches) {
        for (const match of figureMatches) {
          const figureNum = match.replace(/figure\s*/i, '').trim();
          if (!figureNumberMap.has(figureNum)) {
            figureNumberMap.set(figureNum, []);
          }
          figureNumberMap.get(figureNum)!.push({
            shortcode,
            metadata: metaData,
            score: 0
          });
        }
      }
    }
    
    // Update shortcodes in figure-metadata.json
    for (const image of metadata.images) {
      const imageFigureNumber = image.figure_number || '';
      const imageChapter = normalizeChapter(image.chapter || '');
      const imageTopic = normalizeTopic(image.topic || '');
      const imageCaption = (image.caption || '').toLowerCase();
      
      // Extract figure number
      const figureNumMatch = imageFigureNumber.match(/\d+\.\d+/);
      const figureNum = figureNumMatch ? figureNumMatch[0] : '';
      
      if (!figureNum) {
        console.log(`[fix-format] ⚠️ No figure number for: ${image.caption?.substring(0, 40)}`);
        continue;
      }
      
      // Find candidates by figure number
      const candidates = figureNumberMap.get(figureNum) || [];
      
      if (candidates.length === 0) {
        notFoundCount++;
        notFound.push(`${image.figure_number} - ${image.shortcode}`);
        console.log(`[fix-format] ⚠️ No shortcode found for ${image.figure_number}`);
        continue;
      }
      
      // Score candidates
      let bestMatch: { shortcode: string; score: number } | null = null;
      
      for (const candidate of candidates) {
        const metaData = candidate.metadata;
        const metaChapter = normalizeChapter(metaData.chapterName || metaData.chapter || '');
        const metaTopic = normalizeTopic(metaData.topicName || metaData.topic || '');
        const metaCaption = (metaData.caption || metaData.description || '').toLowerCase();
        
        let score = 0;
        
        // Chapter match (high weight)
        if (metaChapter && imageChapter) {
          const chapterScore = similarityScore(metaChapter, imageChapter);
          score += chapterScore * 0.4;
        }
        
        // Topic match (high weight)
        if (metaTopic && imageTopic) {
          const topicScore = similarityScore(metaTopic, imageTopic);
          score += topicScore * 0.4;
        }
        
        // Caption match (medium weight)
        if (metaCaption && imageCaption) {
          const captionScore = similarityScore(metaCaption, imageCaption);
          score += captionScore * 0.2;
        }
        
        candidate.score = score;
        
        if (score > (bestMatch?.score || 0)) {
          bestMatch = { shortcode: candidate.shortcode, score };
        }
      }
      
      // Update shortcode if we found a match (use best match even if score is low, since figure number matches)
      if (bestMatch) {
        const oldShortcode = image.shortcode;
        image.shortcode = bestMatch.shortcode;
        updatedCount++;
        if (bestMatch.score > 0.5) {
          console.log(`[fix-format] ✅ Updated: ${image.figure_number} "${oldShortcode}" → "${bestMatch.shortcode}" (score: ${bestMatch.score.toFixed(2)})`);
        } else {
          console.log(`[fix-format] ⚠️ Updated (low score): ${image.figure_number} "${oldShortcode}" → "${bestMatch.shortcode}" (score: ${bestMatch.score.toFixed(2)})`);
        }
      }
    }
    
    console.log(`[fix-format] ✅ Updated ${updatedCount} shortcodes to match image-shortcodes.json format`);
    console.log(`[fix-format] ⚠️ ${notFoundCount} shortcodes not found in image-shortcodes.json`);
    
    if (notFound.length > 0) {
      console.log(`[fix-format] ⚠️ Missing shortcodes:`, notFound.slice(0, 10));
    }
    
    // Save updated figure-metadata.json
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    
    console.log(`[fix-format] ✅ Successfully updated figure-metadata.json`);
    console.log(`[fix-format] File saved to: ${metadataPath}`);
    
  } catch (error: any) {
    console.error('[fix-format] Error:', error);
    throw error;
  }
}

// Run the script
fixShortcodeFormat().catch(console.error);

export { fixShortcodeFormat };





