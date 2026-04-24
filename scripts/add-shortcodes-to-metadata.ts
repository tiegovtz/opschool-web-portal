/**
 * Script to add shortcodes to figure-metadata.json
 * Matches figures from figure-metadata.json to existing shortcodes in image-shortcodes.json
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

function extractFigureNumber(text: string): string | null {
  const match = text.match(/figure\s*(\d+\.\d+)/i);
  return match ? `figure${match[1]}` : null;
}

function generateShortcodeFromFigure(figureNumber: string, caption: string): string {
  // Extract number from figure (e.g., "Figure 6.3" -> "6_3")
  const numberMatch = figureNumber.match(/\d+\.(\d+)/);
  const numberPart = numberMatch ? `${numberMatch[0].replace('.', '_')}` : figureNumber.replace(/\D/g, '_');
  
  // Create shortcode from caption (first few words, lowercase, underscores)
  const captionWords = caption
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 3)
    .join('_');
  
  return `biology_figure_${numberPart}_${captionWords}`.substring(0, 60).replace(/_+$/, '');
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

async function addShortcodesToMetadata() {
  try {
    
    // Load figure-metadata.json
    const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Load image-shortcodes.json
    const shortcodesPath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const shortcodesData = JSON.parse(shortcodesContent);
    const shortcodes = shortcodesData.shortcodes || {};
    
    // console.log(`[add-shortcodes] Loaded ${metadata.images.length} figures from figure-metadata.json`);
    // console.log(`[add-shortcodes] Loaded ${Object.keys(shortcodes).length} shortcodes from image-shortcodes.json`);
    
    let matchedCount = 0;
    let generatedCount = 0;
    const unmatched: string[] = [];
    
    // Create a lookup map from shortcodes metadata for faster matching
    const shortcodeMap = new Map<string, { shortcode: string; metadata: any }>();
    
    for (const [shortcode, metadata] of Object.entries(shortcodes)) {
      const meta = metadata as any;
      const key = `${normalizeChapter(meta.chapterName || meta.chapter || '')}|${normalizeTopic(meta.topicName || meta.topic || '')}|${normalizeFigureNumber(meta.figureNumber || meta.figure_number || '')}`;
      if (key && key !== '||') {
        shortcodeMap.set(key, { shortcode, metadata: meta });
      }
    }
    
    // Match and add shortcodes to figure-metadata.json entries
    for (const image of metadata.images) {
      // Skip if already has shortcode
      if (image.shortcode) {
        continue;
      }
      
      const imageChapter = normalizeChapter(image.chapter);
      const imageTopic = normalizeTopic(image.topic);
      const imageFigure = normalizeFigureNumber(image.figure_number);
      
      // Try exact match first: chapter + topic + figure_number
      const exactKey = `${imageChapter}|${imageTopic}|${imageFigure}`;
      let matchedShortcode = shortcodeMap.get(exactKey);
      
      // If no exact match, try fuzzy matching
      if (!matchedShortcode) {
        let bestMatch: { shortcode: string; score: number } | null = null;
        
        for (const [shortcode, meta] of Object.entries(shortcodes)) {
          const metaData = meta as any;
          const metaChapter = normalizeChapter(metaData.chapterName || metaData.chapter || '');
          const metaTopic = normalizeTopic(metaData.topicName || metaData.topic || '');
          const metaFigure = normalizeFigureNumber(metaData.figureNumber || metaData.figure_number || '');
          const metaCaption = (metaData.caption || metaData.description || '').toLowerCase();
          
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
          
          // Figure number match
          if (metaFigure && imageFigure) {
            if (metaFigure === imageFigure) {
              score += 1.0; // Exact figure number match is very strong
            } else {
              const figureScore = similarityScore(metaFigure, imageFigure);
              score += figureScore * 0.4;
            }
          }
          
          // Caption match
          if (metaCaption && image.caption) {
            const captionScore = similarityScore(metaCaption, image.caption.toLowerCase());
            score += captionScore * 0.4;
          }
          
          if (score > (bestMatch?.score || 0)) {
            bestMatch = { shortcode, score };
          }
        }
        
        // Use best match if score is high enough (>= 0.6)
        if (bestMatch && bestMatch.score >= 0.6) {
          matchedShortcode = { shortcode: bestMatch.shortcode, metadata: shortcodes[bestMatch.shortcode] };
        }
      }
      
      // Add shortcode to image entry
      if (matchedShortcode) {
        image.shortcode = matchedShortcode.shortcode;
        matchedCount++;
        // console.log(`[add-shortcodes] ✅ Matched: ${image.figure_number} → ${matchedShortcode.shortcode}`);
      } else {
        // Generate new shortcode if no match found
        image.shortcode = generateShortcodeFromFigure(image.figure_number, image.caption);
        generatedCount++;
        unmatched.push(`${image.figure_number} (${image.caption.substring(0, 40)}...)`);
        // console.log(`[add-shortcodes] ⚠️ Generated shortcode: ${image.figure_number} → ${image.shortcode}`);
      }
    }
    
    // console.log(`[add-shortcodes] ✅ Matched ${matchedCount} figures to existing shortcodes`);
    // console.log(`[add-shortcodes] ⚠️ Generated ${generatedCount} new shortcodes for unmatched figures`);
    
    if (unmatched.length > 0) {
      // console.log(`[add-shortcodes] ⚠️ Unmatched figures (generated shortcodes):`, unmatched.slice(0, 5));
    }
    
    // Save updated figure-metadata.json
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    
    // console.log(`[add-shortcodes] ✅ Successfully updated figure-metadata.json`);
    // console.log(`[add-shortcodes] File saved to: ${metadataPath}`);
    
  } catch (error: any) {
    console.error('[add-shortcodes] Error:', error);
    throw error;
  }
}

// Run the script
addShortcodesToMetadata().catch(console.error);

export { addShortcodesToMetadata };


















