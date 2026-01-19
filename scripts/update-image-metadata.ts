/**
 * Script to update image-shortcodes.json with new metadata
 * Adds: caption, figureNumber, pageNumber fields by matching with chapter/topic/caption
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

function normalizeChapter(chapter: string): string {
  return chapter.toLowerCase().trim().replace(/^chapter\s*/i, '').replace(/\s+/g, ' ');
}

function normalizeTopic(topic: string): string {
  return topic.toLowerCase().trim().replace(/\s+/g, ' ');
}

function extractFigureNumber(text: string): string | null {
  const match = text.match(/figure\s*(\d+\.\d+)/i);
  return match ? `Figure ${match[1]}` : null;
}

function similarityScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Simple word overlap
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

async function updateImageMetadata() {
  try {
    console.log('[update-metadata] Starting metadata update...');
    
    // Load new metadata from file
    const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const newMetadata = JSON.parse(metadataContent);
    
    // Load existing shortcodes
    const filePath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    console.log(`[update-metadata] Loaded ${Object.keys(data.shortcodes || {}).length} existing shortcodes`);
    console.log(`[update-metadata] Loaded ${newMetadata.images.length} new metadata entries`);
    
    const shortcodes = data.shortcodes || {};
    let matchedCount = 0;
    let updatedCount = 0;
    
    // Create a map of new metadata by chapter+topic+caption for efficient matching
    const metadataMap: Map<string, any> = new Map();
    for (const img of newMetadata.images) {
      const key = `${normalizeChapter(img.chapter)}|${normalizeTopic(img.topic)}|${img.caption.toLowerCase().substring(0, 50)}`;
      metadataMap.set(key, img);
    }
    
    // Match and update shortcodes
    for (const [shortcode, metadata] of Object.entries(shortcodes) as [string, any][]) {
      const existingChapter = (metadata.chapterName || '').toLowerCase().trim();
      const existingTopic = (metadata.topicName || '').toLowerCase().trim();
      const existingDesc = (metadata.description || metadata.alt || '').toLowerCase();
      
      // Try to find matching metadata
      let bestMatch: any = null;
      let bestScore = 0;
      
      for (const [key, newMeta] of metadataMap.entries()) {
        const [newChapter, newTopic, newCaption] = key.split('|');
        
        // Calculate match score
        let score = 0;
        
        // Chapter match
        const chapterNorm = normalizeChapter(existingChapter);
        if (chapterNorm && newChapter) {
          const chapterScore = similarityScore(chapterNorm, newChapter);
          score += chapterScore * 0.3;
        }
        
        // Topic match
        const topicNorm = normalizeTopic(existingTopic);
        if (topicNorm && newTopic) {
          const topicScore = similarityScore(topicNorm, newTopic);
          score += topicScore * 0.3;
        }
        
        // Caption/description match
        if (existingDesc && newCaption) {
          const descScore = similarityScore(existingDesc, newCaption);
          score += descScore * 0.4;
        }
        
        // Figure number match in description
        const figureInDesc = extractFigureNumber(existingDesc);
        if (figureInDesc && newMeta.figure_number) {
          if (figureInDesc.toLowerCase() === newMeta.figure_number.toLowerCase()) {
            score += 1.0; // Exact figure number match is very strong
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = newMeta;
        }
      }
      
      // Update if we found a good match (score > 0.5)
      if (bestMatch && bestScore > 0.5) {
        matchedCount++;
        
        // Only update if fields are missing or different
        const needsUpdate = 
          !metadata.caption || 
          !metadata.figureNumber || 
          !metadata.pageNumber;
        
        if (needsUpdate) {
          metadata.caption = bestMatch.caption || metadata.caption;
          metadata.figureNumber = bestMatch.figure_number || metadata.figureNumber;
          metadata.figure_number = bestMatch.figure_number || metadata.figure_number; // Also store as figure_number for compatibility
          metadata.pageNumber = bestMatch.page_number || metadata.pageNumber;
          metadata.page_number = bestMatch.page_number || metadata.page_number; // Also store as page_number for compatibility
          
          // Also update chapter/topic if they're more complete in new metadata
          if (bestMatch.chapter && !metadata.chapterName) {
            metadata.chapterName = bestMatch.chapter;
          }
          if (bestMatch.topic && !metadata.topicName) {
            metadata.topicName = bestMatch.topic;
          }
          
          updatedCount++;
        }
      }
    }
    
    console.log(`[update-metadata] Matched ${matchedCount} shortcodes, updated ${updatedCount} with new metadata`);
    
    // Save updated data
    data.generatedAt = new Date().toISOString();
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`[update-metadata] ✅ Successfully updated image-shortcodes.json`);
    console.log(`[update-metadata] File saved to: ${filePath}`);
    
  } catch (error: any) {
    console.error('[update-metadata] Error:', error);
    throw error;
  }
}

// Run the update
updateImageMetadata().catch(console.error);

export { updateImageMetadata };
