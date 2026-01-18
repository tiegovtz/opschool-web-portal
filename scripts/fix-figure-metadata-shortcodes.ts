/**
 * Script to fix figure-metadata.json:
 * 1. Remove path, simulationFileUrl, matchType fields (these should not be here)
 * 2. Update shortcodes to match actual shortcodes from image-shortcodes.json
 * Matching is done by figure number + caption/chapter/topic similarity
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

async function fixFigureMetadataShortcodes() {
  try {
    console.log('[fix-shortcodes] Starting to fix figure-metadata.json...');
    
    // Load figure-metadata.json
    const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Load image-shortcodes.json
    const shortcodesPath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const shortcodesData = JSON.parse(shortcodesContent);
    const shortcodes = shortcodesData.shortcodes || {};
    
    console.log(`[fix-shortcodes] Loaded ${metadata.images.length} figures from figure-metadata.json`);
    console.log(`[fix-shortcodes] Loaded ${Object.keys(shortcodes).length} shortcodes from image-shortcodes.json`);
    
    let shortcodeUpdatedCount = 0;
    let fieldsRemovedCount = 0;
    
    // Build lookup maps for faster matching
    const figureNumberMap = new Map<string, Array<{ shortcode: string; metadata: any; score: number }>>();
    
    // Index shortcodes by figure number (from descriptions/captions)
    for (const [shortcode, meta] of Object.entries(shortcodes)) {
      const metaData = meta as any;
      const description = (metaData.description || '').toLowerCase();
      const caption = (metaData.caption || '').toLowerCase();
      const alt = (metaData.alt || '').toLowerCase();
      const searchableText = (metaData.searchableText || '').toLowerCase();
      
      // Extract figure numbers from text (e.g., "Figure 6.3" -> "6.3")
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
            score: 0 // Will calculate score later
          });
        }
      }
    }
    
    // Process each figure in metadata
    for (const image of metadata.images) {
      // Step 1: Remove URL fields
      const hadPath = 'path' in image;
      const hadSimulationFileUrl = 'simulationFileUrl' in image;
      const hadMatchType = 'matchType' in image;
      
      if (hadPath) {
        delete image.path;
        fieldsRemovedCount++;
      }
      if (hadSimulationFileUrl) {
        delete image.simulationFileUrl;
        fieldsRemovedCount++;
      }
      if (hadMatchType) {
        delete image.matchType;
        fieldsRemovedCount++;
      }
      
      // Step 2: Match shortcode to existing shortcode from image-shortcodes.json
      const imageFigureNumber = image.figure_number || '';
      const imageChapter = normalizeChapter(image.chapter || '');
      const imageTopic = normalizeTopic(image.topic || '');
      const imageCaption = (image.caption || '').toLowerCase();
      
      // Extract figure number (e.g., "Figure 6.3" -> "6.3")
      const figureNumMatch = imageFigureNumber.match(/\d+\.\d+/);
      const figureNum = figureNumMatch ? figureNumMatch[0] : '';
      
      if (!figureNum) {
        console.log(`[fix-shortcodes] ⚠️ No figure number found for: ${image.caption?.substring(0, 40)}`);
        continue;
      }
      
      // Find candidates by figure number
      const candidates = figureNumberMap.get(figureNum) || [];
      
      if (candidates.length === 0) {
        console.log(`[fix-shortcodes] ⚠️ No shortcode found for ${image.figure_number}`);
        continue;
      }
      
      // Score candidates by chapter/topic/caption similarity
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
        
        // Update candidate score
        candidate.score = score;
        
        // Track best match
        if (score > (bestMatch?.score || 0)) {
          bestMatch = { shortcode: candidate.shortcode, score };
        }
      }
      
      // Update shortcode if we found any match (figure number is a unique identifier)
      // Even with low score, if figure number matches, it's likely the correct image
      if (bestMatch) {
        const oldShortcode = image.shortcode;
        image.shortcode = bestMatch.shortcode;
        shortcodeUpdatedCount++;
        if (bestMatch.score > 0.5) {
          console.log(`[fix-shortcodes] ✅ Updated: ${image.figure_number} "${oldShortcode}" → "${bestMatch.shortcode}" (score: ${bestMatch.score.toFixed(2)})`);
        } else {
          console.log(`[fix-shortcodes] ⚠️ Updated (low score but figure match): ${image.figure_number} "${oldShortcode}" → "${bestMatch.shortcode}" (score: ${bestMatch.score.toFixed(2)})`);
        }
      }
    }
    
    console.log(`[fix-shortcodes] ✅ Removed ${fieldsRemovedCount} URL/type fields`);
    console.log(`[fix-shortcodes] ✅ Updated ${shortcodeUpdatedCount} shortcodes to match image-shortcodes.json`);
    
    // Save updated figure-metadata.json
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    
    console.log(`[fix-shortcodes] ✅ Successfully fixed figure-metadata.json`);
    console.log(`[fix-shortcodes] File saved to: ${metadataPath}`);
    
  } catch (error: any) {
    console.error('[fix-shortcodes] Error:', error);
    throw error;
  }
}

// Run the script
fixFigureMetadataShortcodes().catch(console.error);

export { fixFigureMetadataShortcodes };

