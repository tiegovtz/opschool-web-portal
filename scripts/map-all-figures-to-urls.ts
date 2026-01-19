/**
 * Script to create a complete mapping of all figures from figure-metadata.json
 * to their correct URLs from image-shortcodes.json
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

interface FigureMetadata {
  chapter: string;
  topic: string;
  figure_number: string;
  caption: string;
  page_number: number;
  shortcode: string;
}

interface ImageShortcode {
  path: string;
  alt: string;
  category: string;
  description?: string;
  chapterName?: string;
  topicName?: string;
  subjectName?: string;
  figureNumber?: string;
  figure_number?: string;
  caption?: string;
  pageNumber?: number;
  page_number?: number;
}

function normalizeChapter(chapter: string): string {
  return chapter.toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeTopic(topic: string): string {
  return topic.toLowerCase().trim().replace(/\s+/g, ' ');
}

function extractFigureNumber(text: string): string | null {
  // Extract figure number like "Figure 1.1", "1.1", "Figure 1.2", etc.
  const match = text.match(/figure\s*(\d+\.\d+)/i);
  if (match) {
    return match[1]; // Return just the number part (e.g., "1.1")
  }
  return null;
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

async function mapAllFiguresToUrls() {
  try {
    console.log('[map-figures] Starting to map all figures to URLs...');
    
    // Load figure-metadata.json
    const metadataPath = join(process.cwd(), 'server', 'data', 'figure-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    const figures: FigureMetadata[] = metadata.images || [];
    
    console.log(`[map-figures] Loaded ${figures.length} figures from figure-metadata.json`);
    
    // Load image-shortcodes.json
    const shortcodesPath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    const shortcodesContent = await readFile(shortcodesPath, 'utf-8');
    const shortcodesData = JSON.parse(shortcodesContent);
    const shortcodes: Record<string, ImageShortcode> = shortcodesData.shortcodes || {};
    
    console.log(`[map-figures] Loaded ${Object.keys(shortcodes).length} shortcodes from image-shortcodes.json`);
    
    // Build lookup maps for faster matching
    const shortcodeByShortcode = new Map<string, ImageShortcode>();
    const shortcodesByFigureNumber = new Map<string, Array<{ shortcode: string; metadata: ImageShortcode }>>();
    const shortcodesByChapter = new Map<string, Array<{ shortcode: string; metadata: ImageShortcode }>>();
    
    // Index shortcodes
    for (const [shortcodeKey, shortcodeMeta] of Object.entries(shortcodes)) {
      shortcodeByShortcode.set(shortcodeKey, shortcodeMeta);
      
      // Index by figure number
      const figureNum = extractFigureNumber(
        shortcodeMeta.figureNumber || 
        shortcodeMeta.figure_number || 
        shortcodeMeta.description || 
        shortcodeMeta.alt || 
        ''
      );
      if (figureNum) {
        if (!shortcodesByFigureNumber.has(figureNum)) {
          shortcodesByFigureNumber.set(figureNum, []);
        }
        shortcodesByFigureNumber.get(figureNum)!.push({ shortcode: shortcodeKey, metadata: shortcodeMeta });
      }
      
      // Index by chapter
      const chapter = normalizeChapter(shortcodeMeta.chapterName || '');
      if (chapter) {
        if (!shortcodesByChapter.has(chapter)) {
          shortcodesByChapter.set(chapter, []);
        }
        shortcodesByChapter.get(chapter)!.push({ shortcode: shortcodeKey, metadata: shortcodeMeta });
      }
    }
    
    // Map each figure to its URL
    const mapping: Array<{
      figure: FigureMetadata;
      shortcode: string;
      url: string;
      matchType: 'exact_shortcode' | 'figure_number' | 'chapter_caption' | 'not_found';
      confidence: number;
    }> = [];
    
    let exactMatches = 0;
    let figureNumberMatches = 0;
    let chapterCaptionMatches = 0;
    let notFound = 0;
    
    for (const figure of figures) {
      const figureNum = extractFigureNumber(figure.figure_number);
      const figureChapter = normalizeChapter(figure.chapter);
      const figureTopic = normalizeTopic(figure.topic);
      const figureCaption = (figure.caption || '').toLowerCase();
      
      let bestMatch: {
        shortcode: string;
        url: string;
        matchType: 'exact_shortcode' | 'figure_number' | 'chapter_caption' | 'not_found';
        confidence: number;
      } | null = null;
      
      // Method 1: Exact shortcode match (highest priority)
      if (figure.shortcode && shortcodeByShortcode.has(figure.shortcode)) {
        const shortcodeMeta = shortcodeByShortcode.get(figure.shortcode)!;
        bestMatch = {
          shortcode: figure.shortcode,
          url: shortcodeMeta.path,
          matchType: 'exact_shortcode',
          confidence: 1.0
        };
        exactMatches++;
      }
      // Method 2: Match by figure number + description/caption (PRIORITY METHOD)
      else if (figureNum) {
        // Search all shortcodes for figure number match
        const candidates: Array<{ shortcode: string; metadata: ImageShortcode; score: number }> = [];
        
        for (const [shortcodeKey, shortcodeMeta] of Object.entries(shortcodes)) {
          // Extract figure number from various fields
          const metaFigureNum = extractFigureNumber(
            shortcodeMeta.figureNumber || 
            shortcodeMeta.figure_number || 
            shortcodeMeta.description || 
            shortcodeMeta.alt || 
            ''
          );
          
          // Must match figure number
          if (metaFigureNum !== figureNum) continue;
          
          const candidateChapter = normalizeChapter(shortcodeMeta.chapterName || '');
          const candidateTopic = normalizeTopic(shortcodeMeta.topicName || '');
          const candidateCaption = (shortcodeMeta.caption || shortcodeMeta.description || shortcodeMeta.alt || '').toLowerCase();
          const candidateDescription = (shortcodeMeta.description || shortcodeMeta.alt || '').toLowerCase();
          
          let score = 0.6; // Base score for figure number match
          
          // Caption/description match (HIGHEST weight - most important)
          if (candidateCaption && figureCaption) {
            const captionScore = similarityScore(candidateCaption, figureCaption);
            score += captionScore * 0.25; // High weight for caption match
          }
          
          // Description match (also high weight)
          if (candidateDescription && figureCaption) {
            const descScore = similarityScore(candidateDescription, figureCaption);
            score += descScore * 0.15;
          }
          
          // Chapter match (medium weight)
          if (candidateChapter && figureChapter) {
            const chapterScore = similarityScore(candidateChapter, figureChapter);
            score += chapterScore * 0.1;
          }
          
          // Topic match (medium weight)
          if (candidateTopic && figureTopic) {
            const topicScore = similarityScore(candidateTopic, figureTopic);
            score += topicScore * 0.1;
          }
          
          // Boost if caption contains key words from figure caption
          const figureCaptionWords = figureCaption.split(/\s+/).filter(w => w.length > 3);
          const matchingWords = figureCaptionWords.filter(word => 
            candidateCaption.includes(word) || candidateDescription.includes(word)
          );
          if (matchingWords.length > 0) {
            score += (matchingWords.length / figureCaptionWords.length) * 0.1;
          }
          
          candidates.push({ shortcode: shortcodeKey, metadata: shortcodeMeta, score });
        }
        
        // Find best candidate
        if (candidates.length > 0) {
          candidates.sort((a, b) => b.score - a.score);
          const bestCandidate = candidates[0];
          
          // Accept match if confidence is reasonable (>= 0.6)
          if (bestCandidate.score >= 0.6) {
            bestMatch = {
              shortcode: bestCandidate.shortcode,
              url: bestCandidate.metadata.path,
              matchType: 'figure_number',
              confidence: bestCandidate.score
            };
            figureNumberMatches++;
          }
        }
      }
      
      // Method 3: Match by chapter and caption similarity
      if (!bestMatch && figureChapter && shortcodesByChapter.has(figureChapter)) {
        const candidates = shortcodesByChapter.get(figureChapter)!;
        
        let bestCandidate: { shortcode: string; metadata: ImageShortcode; score: number } | null = null;
        
        for (const candidate of candidates) {
          const candidateTopic = normalizeTopic(candidate.metadata.topicName || '');
          const candidateCaption = (candidate.metadata.caption || candidate.metadata.description || '').toLowerCase();
          
          let score = 0.3; // Base score for chapter match
          
          // Topic match
          if (candidateTopic && figureTopic) {
            const topicScore = similarityScore(candidateTopic, figureTopic);
            score += topicScore * 0.3;
          }
          
          // Caption match (high weight)
          if (candidateCaption && figureCaption) {
            const captionScore = similarityScore(candidateCaption, figureCaption);
            score += captionScore * 0.4;
          }
          
          if (!bestCandidate || score > bestCandidate.score) {
            bestCandidate = { shortcode: candidate.shortcode, metadata: candidate.metadata, score };
          }
        }
        
        if (bestCandidate && bestCandidate.score > 0.5) {
          bestMatch = {
            shortcode: bestCandidate.shortcode,
            url: bestCandidate.metadata.path,
            matchType: 'chapter_caption',
            confidence: bestCandidate.score
          };
          chapterCaptionMatches++;
        }
      }
      
      // No match found
      if (!bestMatch) {
        bestMatch = {
          shortcode: figure.shortcode || '',
          url: '',
          matchType: 'not_found',
          confidence: 0
        };
        notFound++;
        console.log(`[map-figures] ⚠️ No URL found for ${figure.figure_number} - ${figure.caption?.substring(0, 40)}`);
      }
      
      mapping.push({
        figure,
        ...bestMatch
      });
    }
    
    // Create output mapping file
    const outputMapping = {
      generatedAt: new Date().toISOString(),
      total: mapping.length,
      matched: exactMatches + figureNumberMatches + chapterCaptionMatches,
      notFound: notFound,
      matchBreakdown: {
        exact_shortcode: exactMatches,
        figure_number: figureNumberMatches,
        chapter_caption: chapterCaptionMatches,
        not_found: notFound
      },
      figures: mapping.map(m => ({
        figure_number: m.figure.figure_number,
        caption: m.figure.caption,
        chapter: m.figure.chapter,
        topic: m.figure.topic,
        page_number: m.figure.page_number,
        shortcode: m.shortcode,
        url: m.url,
        matchType: m.matchType,
        confidence: m.confidence
      }))
    };
    
    // Save mapping to file
    const outputPath = join(process.cwd(), 'server', 'data', 'figure-url-mapping.json');
    await writeFile(outputPath, JSON.stringify(outputMapping, null, 2), 'utf-8');
    
    console.log(`\n[map-figures] ✅ Mapping complete!`);
    console.log(`[map-figures] Total figures: ${mapping.length}`);
    console.log(`[map-figures] Exact shortcode matches: ${exactMatches}`);
    console.log(`[map-figures] Figure number matches: ${figureNumberMatches}`);
    console.log(`[map-figures] Chapter/caption matches: ${chapterCaptionMatches}`);
    console.log(`[map-figures] Not found: ${notFound}`);
    console.log(`[map-figures] Mapping saved to: ${outputPath}`);
    
    // Also update figure-metadata.json with URLs (optional - comment out if not needed)
    // Uncomment below to update figure-metadata.json with URLs
    /*
    let updatedCount = 0;
    for (const mapItem of mapping) {
      if (mapItem.url && mapItem.matchType !== 'not_found') {
        const figureIndex = figures.findIndex(f => 
          f.figure_number === mapItem.figure.figure_number &&
          f.chapter === mapItem.figure.chapter &&
          f.topic === mapItem.figure.topic
        );
        if (figureIndex >= 0) {
          figures[figureIndex].url = mapItem.url;
          figures[figureIndex].shortcode = mapItem.shortcode;
          updatedCount++;
        }
      }
    }
    
    metadata.images = figures;
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`[map-figures] Updated ${updatedCount} figures in figure-metadata.json with URLs`);
    */
    
  } catch (error: any) {
    console.error('[map-figures] Error:', error);
    throw error;
  }
}

// Run the script
mapAllFiguresToUrls().catch(console.error);

export { mapAllFiguresToUrls };

