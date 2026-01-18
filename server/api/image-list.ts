import apiDocs from "~/utilities/apiDocs";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { embedQuery } from "./utils/embeddings";

/**
 * Save shortcodes to JSON file
 * @param images - Array of image objects with shortcodes
 * Supports multiple URLs per figure (paths array) for figures with multiple images
 */
async function saveShortcodesToFile(images: Array<{
  path: string;
  paths?: string[];
  alt: string;
  alts?: string[];
  shortcode: string;
  category: string;
  description?: string;
  chapterName?: string;
  topicName?: string;
  subjectName?: string;
}>): Promise<void> {
  try {
    const dataDir = join(process.cwd(), 'server', 'data');
    const filePath = join(dataDir, 'image-shortcodes.json');
    
    // Try to load existing shortcodes to preserve embeddings
    let existingShortcodes: Record<string, any> = {};
    try {
      const existingContent = await readFile(filePath, 'utf-8');
      const existingData = JSON.parse(existingContent);
      existingShortcodes = existingData.shortcodes || {};
      console.log(`[image-list] Preserving ${Object.keys(existingShortcodes).length} existing shortcodes with embeddings`);
    } catch (error) {
      // File doesn't exist yet, that's okay
      console.log('[image-list] No existing shortcodes file found, creating new one');
    }
    
    // Also load figure-metadata.json to match URLs to existing shortcodes
    // ONLY update shortcodes that exist in figure-metadata.json - don't add new ones
    let figureMetadataMap: Map<string, string> = new Map(); // figure_number+chapter+topic -> shortcode
    let allowedShortcodes = new Set<string>(); // Only allow these shortcodes
    try {
      const metadataPath = join(dataDir, 'figure-metadata.json');
      const metadataContent = await readFile(metadataPath, 'utf-8');
      const metadataData = JSON.parse(metadataContent);
      if (metadataData.images && Array.isArray(metadataData.images)) {
        for (const fig of metadataData.images) {
          if (fig.figure_number && fig.shortcode && fig.chapter && fig.topic) {
            const key = `${fig.figure_number}|${fig.chapter}|${fig.topic}`.toLowerCase().trim();
            figureMetadataMap.set(key, fig.shortcode);
            allowedShortcodes.add(fig.shortcode);
          }
        }
        console.log(`[image-list] Loaded ${figureMetadataMap.size} figure shortcodes from figure-metadata.json - ONLY these will be saved`);
      }
    } catch (error) {
      // figure-metadata.json not found or invalid, that's okay - continue without matching
      console.log('[image-list] Could not load figure-metadata.json for shortcode matching');
    }

    // Create a mapping of shortcode to image metadata
    // Supports multiple URLs (paths) and alt texts (alts) for figures with multiple images
    // Single image: uses path/alt; Multi-image: uses paths/alts arrays
    const shortcodeMap: Record<string, {
      path?: string;
      paths?: string[];
      alt: string;
      alts?: string[];
      category: string;
      description?: string;
      chapterName?: string;
      topicName?: string;
      subjectName?: string;
      embedding?: number[];
      searchableText: string;
    }> = {};

    // Don't generate embeddings here - they should be generated manually via /api/generate-embeddings
    // ONLY save shortcodes that exist in figure-metadata.json - don't add new ones
    for (const image of images) {
      // Try to match this image to a shortcode from figure-metadata.json
      // Match ONLY by figure number (extracted from description/alt text)
      let matchedShortcode: string | null = null;
      
      if (image.chapterName && image.topicName) {
        // Try to extract figure number from description or alt text
        const searchText = `${image.description || ''} ${image.alt || ''}`.toLowerCase();
        const figureMatch = searchText.match(/figure\s+(\d+\.\d+)/i);
        
        if (figureMatch) {
          // Match by figure number + chapter + topic
          const figureNumber = `Figure ${figureMatch[1]}`;
          const key = `${figureNumber}|${image.chapterName}|${image.topicName}`.toLowerCase().trim();
          matchedShortcode = figureMetadataMap.get(key) || null;
          
          if (matchedShortcode) {
            console.log(`[image-list] ✅ Matched URL to figure-metadata shortcode: ${matchedShortcode} (${figureNumber})`);
          }
        }
      }
      
      // Use matched shortcode from figure-metadata.json
      // ONLY process if this shortcode is in figure-metadata.json - skip all others
      const finalShortcode = matchedShortcode;
      
      // Skip this image if it doesn't match any shortcode in figure-metadata.json
      if (!finalShortcode || !allowedShortcodes.has(finalShortcode)) {
        continue; // Don't add new shortcodes - only update existing ones
      }
      
      // Create searchable text from all relevant fields
      const searchableText = [
        finalShortcode,
        image.alt,
        image.description || '',
        image.chapterName || '',
        image.topicName || '',
        image.subjectName || ''
      ].filter(Boolean).join(' ');

      // Preserve existing embedding if it exists (check both the generated and matched shortcode)
      const existing = existingShortcodes[finalShortcode] || existingShortcodes[image.shortcode];
      const existingEmbedding = existing?.embedding && Array.isArray(existing.embedding) && existing.embedding.length > 0
        ? existing.embedding
        : undefined;

      // If we matched a shortcode from figure-metadata.json, use that; otherwise use the generated one
      // Handle multiple URLs (paths) and alts for figures with multiple images
      // Check if existing entry has multiple images (paths array)
      const existingPaths = existing?.paths;
      const existingAlts = existing?.alts;
      const isExistingMultiImage = Array.isArray(existingPaths) && existingPaths.length > 0;
      
      // Check if incoming image has multiple images
      const incomingPaths = image.paths;
      const incomingAlts = image.alts;
      const isIncomingMultiImage = Array.isArray(incomingPaths) && incomingPaths.length > 1;
      
      // Build the entry based on whether it's single or multi-image
      const entry: typeof shortcodeMap[string] = {
        alt: image.alt,
        category: image.category,
        description: image.description,
        chapterName: image.chapterName,
        topicName: image.topicName,
        subjectName: image.subjectName,
        embedding: existingEmbedding,
        searchableText: searchableText,
      };
      
      if (isExistingMultiImage || isIncomingMultiImage) {
        // Multi-image figure: merge paths arrays
        const currentPaths = existingPaths || (existing?.path ? [existing.path] : []);
        const newPaths = incomingPaths || [image.path];
        entry.paths = [...new Set([...currentPaths, ...newPaths])];
        
        const currentAlts = existingAlts || (existing?.alt ? [existing.alt] : []);
        const newAlts = incomingAlts || [image.alt];
        entry.alts = [...new Set([...currentAlts, ...newAlts])];
      } else {
        // Single image: just use path
        entry.path = image.path;
      }
      
      shortcodeMap[finalShortcode] = entry;
    }

    // Merge with existing shortcodes to preserve ones not updated
    // Only keep shortcodes that are in figure-metadata.json
    const mergedShortcodes: Record<string, any> = {};
    
    // First, preserve existing shortcodes that are in figure-metadata.json
    for (const shortcode of allowedShortcodes) {
      if (existingShortcodes[shortcode]) {
        mergedShortcodes[shortcode] = existingShortcodes[shortcode];
      }
    }
    
    // Then, update with new URLs for matched shortcodes
    for (const [shortcode, metadata] of Object.entries(shortcodeMap)) {
      if (allowedShortcodes.has(shortcode)) {
        mergedShortcodes[shortcode] = metadata;
      }
    }
    
    // Build images array with only matched shortcodes (for reference, but won't add new ones)
    // Single image uses path/alt; Multi-image uses paths/alts arrays
    const matchedImages = Array.from(allowedShortcodes).map(shortcode => {
      const metadata = mergedShortcodes[shortcode];
      if (!metadata) return null;
      
      const isMultiImage = Array.isArray(metadata.paths) && metadata.paths.length > 0;
      
      const imageEntry: Record<string, any> = {
        alt: metadata.alt || '',
        shortcode: shortcode,
        category: metadata.category || 'biology',
        description: metadata.description,
        chapterName: metadata.chapterName,
        topicName: metadata.topicName,
      };
      
      if (isMultiImage) {
        imageEntry.paths = metadata.paths;
        imageEntry.alts = metadata.alts;
      } else {
        imageEntry.path = metadata.path || '';
      }
      
      return imageEntry;
    }).filter(Boolean);
    
    const data = {
      generatedAt: new Date().toISOString(),
      total: Object.keys(mergedShortcodes).length,
      byCategory: {
        biology: Object.values(mergedShortcodes).filter((s: any) => s.category === 'biology').length,
        physics: Object.values(mergedShortcodes).filter((s: any) => s.category === 'physics').length,
        chemistry: Object.values(mergedShortcodes).filter((s: any) => s.category === 'chemistry').length,
        mathematics: Object.values(mergedShortcodes).filter((s: any) => s.category === 'mathematics').length,
        geography: Object.values(mergedShortcodes).filter((s: any) => s.category === 'geography').length,
        horticulture: Object.values(mergedShortcodes).filter((s: any) => s.category === 'horticulture').length,
        english: Object.values(mergedShortcodes).filter((s: any) => s.category === 'english').length,
        'leather-goods': Object.values(mergedShortcodes).filter((s: any) => s.category === 'leather-goods').length,
      },
      shortcodes: mergedShortcodes, // ONLY shortcodes from figure-metadata.json
      images: matchedImages, // Only images with matched shortcodes
    };

    // Ensure directory exists
    await mkdir(dataDir, { recursive: true });

    // Write to file
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`[image-list] ✅ Saved ${Object.keys(mergedShortcodes).length} shortcodes (${Object.keys(shortcodeMap).length} updated from API) to ${filePath}`);
  } catch (error: any) {
    console.error('[image-list] Failed to save shortcodes to file:', error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Generate a shortcode from a description or text
 * @param text - The description or text to convert to shortcode
 * @param category - Optional category prefix
 * @param fallback - Fallback text if description is empty
 * @returns A sanitized shortcode string
 */
function generateShortcodeFromDescription(
  text: string | undefined,
  category: string = 'simulation',
  fallback: string = 'image'
): string {
  // Use description if available, otherwise use fallback
  const sourceText = text || fallback;
  
  // Convert to lowercase and replace spaces/special chars with underscores
  let shortcode = sourceText
    .toLowerCase()
    // Remove HTML entities
    .replace(/&[a-z]+;/gi, ' ')
    // Replace common punctuation and special chars with spaces
    .replace(/[^\w\s-]/g, ' ')
    // Replace multiple spaces/underscores with single underscore
    .replace(/[\s_-]+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '')
    // Limit length to 50 characters for readability
    .substring(0, 50)
    // Remove trailing underscore if truncated
    .replace(/_+$/, '');
  
  // If empty after processing, use fallback
  if (!shortcode || shortcode.length < 3) {
    shortcode = fallback.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  
  // Add category prefix
  return `${category}_${shortcode}`;
}

/**
 * Extract images from HTML content
 */
function extractImagesFromContent(
  content: string,
  chapterName?: string,
  topicName?: string,
  description?: string
): Array<{
  path: string;
  alt: string;
  shortcode: string;
  category: string;
  description?: string;
  chapterName?: string;
  topicName?: string;
}> {
  const images: Array<{
    path: string;
    alt: string;
    shortcode: string;
    category: string;
    description?: string;
    chapterName?: string;
    topicName?: string;
  }> = [];

  if (!content) return images;

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    const alt = match[2] || '';

    // Skip data URIs and invalid paths
    if (
      !src ||
      src.startsWith('data:') ||
      (!src.startsWith('/') && !src.startsWith('http://') && !src.startsWith('https://'))
    ) {
      continue;
    }

    // Determine category first (needed for shortcode generation)
    const pathLower = src.toLowerCase();
    const altLower = alt.toLowerCase();
    const textToAnalyze = `${pathLower} ${altLower} ${chapterName || ''} ${topicName || ''}`.toLowerCase();

    let category: string | null = null;

    if (
      textToAnalyze.includes('biology') ||
      textToAnalyze.includes('bio') ||
      textToAnalyze.includes('cell') ||
      textToAnalyze.includes('dna') ||
      textToAnalyze.includes('organism') ||
      textToAnalyze.includes('plant') ||
      textToAnalyze.includes('animal') ||
      textToAnalyze.includes('digestion') ||
      textToAnalyze.includes('photosynthesis')
    ) {
      category = 'biology';
    } else if (
      textToAnalyze.includes('physics') ||
      textToAnalyze.includes('wave') ||
      textToAnalyze.includes('circuit') ||
      textToAnalyze.includes('force') ||
      textToAnalyze.includes('motion') ||
      textToAnalyze.includes('energy') ||
      textToAnalyze.includes('electric')
    ) {
      category = 'physics';
    } else if (
      textToAnalyze.includes('chemistry') ||
      textToAnalyze.includes('molecule') ||
      textToAnalyze.includes('reaction') ||
      textToAnalyze.includes('periodic') ||
      textToAnalyze.includes('compound') ||
      textToAnalyze.includes('element')
    ) {
      category = 'chemistry';
    } else if (
      textToAnalyze.includes('math') ||
      textToAnalyze.includes('geometry') ||
      textToAnalyze.includes('graph') ||
      textToAnalyze.includes('equation') ||
      textToAnalyze.includes('algebra') ||
      textToAnalyze.includes('calculus')
    ) {
      category = 'mathematics';
    } else if (
      textToAnalyze.includes('geography') ||
      textToAnalyze.includes('geo') ||
      textToAnalyze.includes('map') ||
      textToAnalyze.includes('climate') ||
      textToAnalyze.includes('terrain')
    ) {
      category = 'geography';
    } else if (
      textToAnalyze.includes('horticulture') ||
      textToAnalyze.includes('crop') ||
      textToAnalyze.includes('planting') ||
      textToAnalyze.includes('farming')
    ) {
      category = 'horticulture';
    } else if (
      textToAnalyze.includes('english') ||
      textToAnalyze.includes('language') ||
      textToAnalyze.includes('grammar') ||
      textToAnalyze.includes('vocabulary') ||
      textToAnalyze.includes('writing')
    ) {
      category = 'english';
    } else if (
      textToAnalyze.includes('leather') ||
      textToAnalyze.includes('footwear') ||
      textToAnalyze.includes('shoe') ||
      textToAnalyze.includes('craft')
    ) {
      category = 'leather-goods';
    }

    // Only include images with a valid category (filter out uncategorized)
    if (category) {
      // Generate shortcode from description (with fallbacks)
      const shortcode = generateShortcodeFromDescription(
        description || alt,  // Use description, fallback to alt text
        category,
        src.split('/').pop() || 'chapter_image'  // Final fallback to filename
      );

      images.push({
        path: src,
        alt: alt || 'Chapter image',
        shortcode,
        category,
        description: description || undefined,
        chapterName,
        topicName,
      });
    }
  }

  return images;
}

export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const query = getQuery(event);
    const categoryFilter = query.category as string | undefined;
    const subjectIdFilter = query.subjectId as string | undefined;
    const limit = query.limit ? parseInt(query.limit as string) : undefined;
    const keyword = query.keyword as string | undefined;
    const refresh = query.refresh === 'true' || query.refresh === '1'; // Only fetch from API if explicitly requested

    // Check if shortcodes file exists and use it by default (unless refresh requested)
    if (!refresh) {
      try {
        const dataDir = join(process.cwd(), 'server', 'data');
        const filePath = join(dataDir, 'image-shortcodes.json');
        const existingContent = await readFile(filePath, 'utf-8');
        const existingData = JSON.parse(existingContent);
        
        // If file exists and has valid data, use it
        if (existingData && existingData.images && Array.isArray(existingData.images) && existingData.images.length > 0) {
          console.log(`[image-list] ✅ Using existing shortcodes file (${existingData.images.length} images). Use ?refresh=true to regenerate.`);
          
          let filteredImages = existingData.images;
          
          // Apply filters to existing data
          if (subjectIdFilter) {
            filteredImages = filteredImages.filter((img: any) => img.subjectId === subjectIdFilter);
          }
          
          if (categoryFilter && ['biology', 'physics', 'chemistry', 'mathematics', 'geography', 'general'].includes(categoryFilter)) {
            filteredImages = filteredImages.filter((img: any) => img.category === categoryFilter);
          }
          
          if (keyword) {
            const keywordLower = keyword.toLowerCase();
            filteredImages = filteredImages.filter(
              (img: any) =>
                img.alt?.toLowerCase().includes(keywordLower) ||
                (img.path?.toLowerCase().includes(keywordLower)) ||
                (Array.isArray(img.paths) && img.paths.some((p: string) => p.toLowerCase().includes(keywordLower))) ||
                img.shortcode?.toLowerCase().includes(keywordLower) ||
                img.description?.toLowerCase().includes(keywordLower) ||
                img.chapterName?.toLowerCase().includes(keywordLower) ||
                img.topicName?.toLowerCase().includes(keywordLower)
            );
          }
          
          if (limit && limit > 0) {
            filteredImages = filteredImages.slice(0, limit);
          }
          
          return {
            success: true,
            total: existingData.images.length,
            filtered: filteredImages.length,
            filters: {
              category: categoryFilter || 'all',
              subjectId: subjectIdFilter || null,
              keyword: keyword || null,
              limit: limit || null,
            },
            byCategory: existingData.byCategory || {},
            images: filteredImages,
            cached: true,
            message: 'Using cached shortcodes. Use ?refresh=true to regenerate from API.',
          };
        }
      } catch (fileError: any) {
        // File doesn't exist or is invalid - continue to fetch from API
        console.log('[image-list] Existing file not found or invalid, will fetch from API:', fileError.message);
      }
    } else {
      console.log('[image-list] Refresh requested - will fetch from API');
    }

    const allImages: Array<{
      path: string;
      alt: string;
      shortcode: string;
      category: string;
      description?: string;
      chapterName?: string;
      topicName?: string;
      subjectName?: string;
      subjectId?: string;
    }> = [];
    const seenPaths = new Set<string>();

    // Fetch topics, subjects, and chapters to create ID-to-name mappings (REQUIRED - no fallback)
    const topicIdToName: Record<string, string> = {};
    const subjectIdToName: Record<string, string> = {};
    const chapterIdToName: Record<string, string> = {};
    const auth_token = getCookie(event, "signInAccessToken");
    
    if (!auth_token) {
      throw createError({
        statusCode: 401,
        message: "Authentication required. Missing signInAccessToken cookie. Please sign in to access the image list.",
      });
    }

    // Fetch topics
    try {
      const topicsResponse = await $fetch(apiDocs.topics.getTopics, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth_token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      
      if (!Array.isArray(topicsResponse)) {
        throw createError({
          statusCode: 500,
          message: `Topics API returned invalid data format. Expected array, got: ${typeof topicsResponse}. Check ${apiDocs.topics.getTopics} endpoint.`,
        });
      }

      topicsResponse.forEach((topic: any) => {
        if (topic._id && topic.name) {
          topicIdToName[topic._id] = topic.name;
        }
      });
      
      if (Object.keys(topicIdToName).length === 0) {
        throw createError({
          statusCode: 500,
          message: `Topics API returned empty or invalid data. No topic names found. Check ${apiDocs.topics.getTopics} endpoint response format.`,
        });
      }
      
      console.log(`[image-list] ✅ Loaded ${Object.keys(topicIdToName).length} topic names for ID resolution`);
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      console.error('[image-list] ❌ Failed to fetch topics for name resolution:', error);
      throw createError({
        statusCode: 500,
        message: `Failed to fetch topics from API: ${error.message || error}. Check that ${apiDocs.topics.getTopics} is accessible and returns topic data with _id and name fields.`,
        cause: error,
      });
    }

    // Fetch subjects
    try {
      const subjectsResponse = await $fetch(apiDocs.subjects.getSubjects, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth_token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      
      if (!Array.isArray(subjectsResponse)) {
        throw createError({
          statusCode: 500,
          message: `Subjects API returned invalid data format. Expected array, got: ${typeof subjectsResponse}. Check ${apiDocs.subjects.getSubjects} endpoint.`,
        });
      }

      subjectsResponse.forEach((subject: any) => {
        if (subject._id && subject.name) {
          subjectIdToName[subject._id] = subject.name;
        }
      });
      
      if (Object.keys(subjectIdToName).length === 0) {
        throw createError({
          statusCode: 500,
          message: `Subjects API returned empty or invalid data. No subject names found. Check ${apiDocs.subjects.getSubjects} endpoint response format.`,
        });
      }
      
      console.log(`[image-list] ✅ Loaded ${Object.keys(subjectIdToName).length} subject names for ID resolution`);
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      console.error('[image-list] ❌ Failed to fetch subjects for name resolution:', error);
      throw createError({
        statusCode: 500,
        message: `Failed to fetch subjects from API: ${error.message || error}. Check that ${apiDocs.subjects.getSubjects} is accessible and returns subject data with _id and name fields.`,
        cause: error,
      });
    }

    // Fetch chapters
    try {
      const chaptersResponse = await $fetch(apiDocs.chapters.getChapters, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth_token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      
      if (!Array.isArray(chaptersResponse)) {
        throw createError({
          statusCode: 500,
          message: `Chapters API returned invalid data format. Expected array, got: ${typeof chaptersResponse}. Check ${apiDocs.chapters.getChapters} endpoint.`,
        });
      }

      chaptersResponse.forEach((chapter: any) => {
        if (chapter._id && chapter.name) {
          chapterIdToName[chapter._id] = chapter.name;
        }
      });
      
      if (Object.keys(chapterIdToName).length === 0) {
        throw createError({
          statusCode: 500,
          message: `Chapters API returned empty or invalid data. No chapter names found. Check ${apiDocs.chapters.getChapters} endpoint response format.`,
        });
      }
      
      console.log(`[image-list] ✅ Loaded ${Object.keys(chapterIdToName).length} chapter names for ID resolution`);
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      console.error('[image-list] ❌ Failed to fetch chapters for name resolution:', error);
      throw createError({
        statusCode: 500,
        message: `Failed to fetch chapters from API: ${error.message || error}. Check that ${apiDocs.chapters.getChapters} is accessible and returns chapter data with _id and name fields.`,
        cause: error,
      });
    }

    // Load existing shortcodes to reuse them (path -> shortcode mapping)
    const pathToShortcode: Record<string, string> = {};
    try {
      const dataDir = join(process.cwd(), 'server', 'data');
      const filePath = join(dataDir, 'image-shortcodes.json');
      const existingContent = await readFile(filePath, 'utf-8');
      const existingData = JSON.parse(existingContent);
      
      // Create mapping from image path to shortcode
      if (existingData.shortcodes) {
        for (const [shortcode, metadata] of Object.entries(existingData.shortcodes)) {
          const meta = metadata as any;
          if (meta.path) {
            pathToShortcode[meta.path] = shortcode;
          }
        }
        console.log(`[image-list] Loaded ${Object.keys(pathToShortcode).length} existing shortcodes to reuse`);
      }
    } catch (error) {
      // File doesn't exist yet, that's okay - will create new shortcodes
      console.log('[image-list] No existing shortcodes file found, will generate new shortcodes');
    }

    console.log('[image-list] Starting image extraction from simulations API...');
    console.log('[image-list] Query parameters:', { categoryFilter, limit, keyword });

    // Fetch from simulations API
    try {
      console.log('[image-list] Fetching from simulations API: https://opschool.tie.go.tz:5001/v1/simulations');
      
      // Get auth token from cookie (same as other endpoints)
      const auth_token = getCookie(event, "signInAccessToken");
      
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // Add authorization if token is available
      if (auth_token) {
        headers['Authorization'] = `Bearer ${auth_token}`;
        console.log('[image-list] Using authentication token');
      } else {
        console.warn('[image-list] No auth token found - API requires authentication. Will try database fallback if API fails.');
        // Still try without auth in case it works, but expect it to fail
      }
      
      // Use $fetch which handles SSL/certificate issues better in Nuxt
      // If SSL certificate issues occur, we can add rejectUnauthorized: false in a custom agent
      const simulationsData = await $fetch('https://opschool.tie.go.tz:5001/v1/simulations', {
        method: 'GET',
        headers,
        timeout: 30000, // 30 second timeout
        retry: 0, // Don't retry automatically
        // If SSL certificate validation fails, uncomment below:
        // @ts-ignore - Node.js https agent options
        // https: {
        //   rejectUnauthorized: false, // Only use in development if certificate is self-signed
        // },
      }).catch((fetchError: any) => {
        console.error('[image-list] $fetch error details:', {
          message: fetchError.message,
          status: fetchError.status,
          statusCode: fetchError.statusCode,
          statusText: fetchError.statusText,
          data: fetchError.data,
          response: fetchError.response,
          cause: fetchError.cause,
          name: fetchError.name,
        });
        
        // Provide more helpful error message
        if (fetchError.message?.includes('certificate') || fetchError.message?.includes('SSL')) {
          console.warn('[image-list] SSL certificate error detected. The API may use a self-signed certificate.');
        }
        if (fetchError.message?.includes('ECONNREFUSED') || fetchError.message?.includes('ENOTFOUND')) {
          console.warn('[image-list] Connection error. The API server may be down or unreachable.');
        }
        
        throw fetchError;
      });
      
      console.log('[image-list] ✅ Successfully fetched from simulations API');
      console.log('[image-list] Response type:', typeof simulationsData, Array.isArray(simulationsData) ? 'array' : 'object');
      
      const simulations = Array.isArray(simulationsData) 
        ? simulationsData 
        : (simulationsData as any)?.data || [];

      console.log(`[image-list] Found ${simulations.length} simulations`);
      if (simulations.length > 0) {
        console.log(`[image-list] First simulation structure:`, {
          keys: Object.keys(simulations[0]),
          hasSimulationFileUrl: !!(simulations[0].simulationFileUrl || simulations[0].simulation_file_url),
          hasImage: !!(simulations[0].image || simulations[0].thumbnail || simulations[0].preview),
          hasDescription: !!(simulations[0].description || simulations[0].desc || simulations[0].summary),
          sample: {
            name: simulations[0].name || simulations[0].title,
            simulationFileUrl: simulations[0].simulationFileUrl || simulations[0].simulation_file_url,
            image: simulations[0].image,
            thumbnail: simulations[0].thumbnail,
            preview: simulations[0].preview,
            description: simulations[0].description || simulations[0].desc || simulations[0].summary,
          }
        });
      }

      // Extract images from simulations
      const seenShortcodes = new Set<string>(); // Track shortcodes for uniqueness
      
      for (const simulation of simulations) {
        // Check for simulationFileUrl as primary field, with fallbacks
        const imagePath = 
          simulation.simulationFileUrl ||
          simulation.simulation_file_url ||
          simulation.simulationFileURL ||
          simulation.image || 
          simulation.thumbnail || 
          simulation.preview || 
          simulation.imageUrl ||
          simulation.image_url ||
          simulation.coverImage ||
          simulation.cover_image ||
          simulation.poster ||
          simulation.icon;
        
        if (imagePath && typeof imagePath === 'string' && !seenPaths.has(imagePath)) {
          seenPaths.add(imagePath);
          
          // Extract description FIRST (before creating shortcode)
          let description = 
            simulation.description || 
            simulation.desc || 
            simulation.summary || 
            simulation.about ||
            simulation.details ||
            undefined;
          
          // Clean HTML tags from description if present
          if (description && typeof description === 'string') {
            // Remove HTML tags but keep text content
            description = description.replace(/<[^>]*>/g, '').trim();
            // Limit length to prevent overly long descriptions
            if (description.length > 500) {
              description = description.substring(0, 500) + '...';
            }
          }
          
          // Resolve subject first (BEFORE category detection) to improve category detection
          let subjectName = simulation.subjectName || simulation.subject_name;
          let subjectId = null;
          
          // Check if subject is an object (nested structure) - EXTRACT BOTH ID AND NAME
          if (simulation.subject && typeof simulation.subject === 'object') {
            // Extract ID if available (priority - needed for category detection)
            if (simulation.subject._id) {
              subjectId = simulation.subject._id;
            } else if (simulation.subject.id) {
              subjectId = simulation.subject.id;
            }
            // Extract name if available
            if (simulation.subject.name) {
              subjectName = simulation.subject.name;
            }
          }
          // If subject is a string, it might be an ID
          else if (simulation.subject && typeof simulation.subject === 'string') {
            subjectId = simulation.subject;
            // Try to resolve ID to name if possible
            if (subjectIdToName[subjectId]) {
              subjectName = subjectIdToName[subjectId];
            }
          }
          
          // If subject is an object with a name property, use that
          if (subjectName && typeof subjectName === 'object' && subjectName.name) {
            subjectName = subjectName.name;
          }
          // If subjectName is actually an ID string, resolve it to a name
          else if (subjectName && typeof subjectName === 'string' && subjectIdToName[subjectName]) {
            const originalSubjectName = subjectName;
            if (!subjectId) {
              subjectId = subjectName; // Store the ID
            }
            subjectName = subjectIdToName[subjectName];
            console.log(`[image-list] Resolved subject ID "${originalSubjectName}" to name "${subjectName}"`);
          }
          // If we have subjectId but no name, resolve it
          else if (subjectId && !subjectName && subjectIdToName[subjectId]) {
            subjectName = subjectIdToName[subjectId];
            console.log(`[image-list] Resolved subject ID "${subjectId}" to name "${subjectName}"`);
          }
          // Fallback: if we still don't have subjectId but have simulation.subject, try to extract it
          else if (!subjectId && simulation.subject) {
            if (typeof simulation.subject === 'string') {
              subjectId = simulation.subject;
            } else if (simulation.subject._id) {
              subjectId = simulation.subject._id;
            } else if (simulation.subject.id) {
              subjectId = simulation.subject.id;
            }
          }
          
          // Determine category from subject ID and subject name only (NO keyword detection)
          let category: string | null = null;
          const resolvedSubjectNameLower = (subjectName || '').toLowerCase();
          
          // Subject ID to category mapping
          const subjectIdToCategory: Record<string, string> = {
            '665865487b076d51f6fc037a': 'physics',      // Physics
            '665865867b076d51f6fc037f': 'chemistry',    // Chemistry
            '6658658d7b076d51f6fc0381': 'biology',      // Biology
            '67f50a3fb88b1b7c13b40b40': 'mathematics',  // Mathematics
            '665865967b076d51f6fc0383': 'geography',    // Geography
            '6960c874f17b11250e5da33f': 'horticulture', // Horticulture Attendant
            '696a4063cae7037b37ce6758': 'english',      // English
            '696b32ae90be598ced92fb13': 'leather-goods', // Leather Goods and Footwear
          };
          
          // Check subject ID first (highest priority)
          if (subjectId && subjectIdToCategory[subjectId]) {
            category = subjectIdToCategory[subjectId];
          }
          // Fallback to subject name if ID not found or not mapped
          else if (resolvedSubjectNameLower.includes('physics')) {
            category = 'physics';
          }
          else if (resolvedSubjectNameLower.includes('biology') || resolvedSubjectNameLower.includes('bio')) {
            category = 'biology';
          }
          else if (resolvedSubjectNameLower.includes('chemistry')) {
            category = 'chemistry';
          }
          else if (resolvedSubjectNameLower.includes('math') || resolvedSubjectNameLower.includes('mathematics')) {
            category = 'mathematics';
          }
          else if (resolvedSubjectNameLower.includes('geography') || resolvedSubjectNameLower.includes('geo')) {
            category = 'geography';
          }
          else if (resolvedSubjectNameLower.includes('horticulture')) {
            category = 'horticulture';
          }
          else if (resolvedSubjectNameLower.includes('english')) {
            category = 'english';
          }
          else if (resolvedSubjectNameLower.includes('leather') || resolvedSubjectNameLower.includes('footwear')) {
            category = 'leather-goods';
          }
          // If no category match, category remains null (item will be filtered out)
          
          // Get alt text (needed for both new and existing shortcodes)
          const altText = simulation.name || simulation.title || simulation.label || 'Simulation image';
          
          // Check if this image already has a shortcode (reuse existing)
          let shortcode = pathToShortcode[imagePath];
          
          if (!shortcode) {
            // Generate new shortcode from description (with fallbacks)
            shortcode = generateShortcodeFromDescription(
              description,           // Primary: use description
              category,              // Category prefix
              altText                // Fallback: use alt text if no description
            );
            
            // Ensure uniqueness by appending number if needed
            let uniqueShortcode = shortcode;
            let counter = 1;
            while (seenShortcodes.has(uniqueShortcode)) {
              uniqueShortcode = `${shortcode}_${counter}`;
              counter++;
            }
            seenShortcodes.add(uniqueShortcode);
            shortcode = uniqueShortcode;
          } else {
            // Reuse existing shortcode
            seenShortcodes.add(shortcode);
            console.log(`[image-list] Reusing existing shortcode "${shortcode}" for image: ${imagePath.substring(0, 50)}...`);
          }
          
          // Resolve topic name from ID if needed
          let topicName = simulation.topicName || simulation.topic_name;
          let topicId = null;
          
          // Check if topic is an object (nested structure)
          if (simulation.topic && typeof simulation.topic === 'object') {
            if (simulation.topic.name) {
              topicName = simulation.topic.name;
            } else if (simulation.topic._id) {
              topicId = simulation.topic._id;
            }
          }
          
          // If topic is an object with a name property, use that
          if (topicName && typeof topicName === 'object' && topicName.name) {
            topicName = topicName.name;
          }
          // If topic is an ID, resolve it to a name
          else if (topicName && typeof topicName === 'string' && topicIdToName[topicName]) {
            const originalTopicName = topicName;
            topicName = topicIdToName[topicName];
            console.log(`[image-list] Resolved topic ID "${originalTopicName}" to name "${topicName}"`);
          } else if (topicId && topicIdToName[topicId]) {
            topicName = topicIdToName[topicId];
            console.log(`[image-list] Resolved topic ID "${topicId}" to name "${topicName}"`);
          } else if (topicName && typeof topicName === 'string' && topicName.length > 20) {
            // Likely an ID that wasn't found in mapping
            console.warn(`[image-list] Topic appears to be an ID but not found in mapping: "${topicName.substring(0, 20)}..."`);
          }

          // Subject already resolved above (before category detection) - just ensure subjectId is stored
          if (!subjectId && simulation.subject) {
            // Try to extract ID from various formats (in case it wasn't captured earlier)
            if (typeof simulation.subject === 'string' && !subjectIdToName[simulation.subject]) {
              subjectId = simulation.subject;
            } else if (simulation.subject && typeof simulation.subject === 'object' && simulation.subject._id) {
              subjectId = simulation.subject._id;
            }
          }

          // Resolve chapter name from ID if needed
          let chapterName = simulation.chapterName || simulation.chapter_name;
          let chapterId = null;
          
          // Check if chapter is an object (nested structure)
          if (simulation.chapter && typeof simulation.chapter === 'object') {
            if (simulation.chapter.name) {
              chapterName = simulation.chapter.name;
            } else if (simulation.chapter._id) {
              chapterId = simulation.chapter._id;
            }
          }
          
          // If chapter is an object with a name property, use that
          if (chapterName && typeof chapterName === 'object' && chapterName.name) {
            chapterName = chapterName.name;
          }
          // If chapter is an ID, resolve it to a name
          else if (chapterName && typeof chapterName === 'string' && chapterIdToName[chapterName]) {
            const originalChapterName = chapterName;
            chapterName = chapterIdToName[chapterName];
            console.log(`[image-list] Resolved chapter ID "${originalChapterName}" to name "${chapterName}"`);
          } else if (chapterId && chapterIdToName[chapterId]) {
            chapterName = chapterIdToName[chapterId];
            console.log(`[image-list] Resolved chapter ID "${chapterId}" to name "${chapterName}"`);
          } else if (chapterName && typeof chapterName === 'string' && chapterName.length > 20) {
            // Likely an ID that wasn't found in mapping
            console.warn(`[image-list] Chapter appears to be an ID but not found in mapping: "${chapterName.substring(0, 20)}..."`);
          }

          // Only add images that have a valid category (filter out uncategorized)
          if (category) {
            allImages.push({
              path: imagePath,
              alt: altText,
              shortcode,
              category,
              description: description || undefined,
              chapterName: chapterName || undefined,
              topicName: topicName || undefined,
              subjectName: subjectName || undefined,
              subjectId: subjectId || undefined,
            });
          }
          
          // Log if description was found
          if (description) {
            console.log(`[image-list] Added image with shortcode "${shortcode}" from description: ${imagePath}`);
          } else {
            console.log(`[image-list] Added image with shortcode "${shortcode}" (no description, used alt text): ${imagePath}`);
          }
        }
        
        // Also check if simulation has content/description with embedded images
        const content = simulation.content || simulation.description || simulation.html || simulation.body;
        if (content && typeof content === 'string') {
          // Extract description from simulation for embedded images
          let contentDescription = 
            simulation.description || 
            simulation.desc || 
            simulation.summary || 
            simulation.about ||
            simulation.details ||
            undefined;
          
          // Clean HTML tags from description if present
          if (contentDescription && typeof contentDescription === 'string') {
            contentDescription = contentDescription.replace(/<[^>]*>/g, '').trim();
            if (contentDescription.length > 500) {
              contentDescription = contentDescription.substring(0, 500) + '...';
            }
          }
          
          const contentImages = extractImagesFromContent(
            content,
            simulation.name || simulation.title || simulation.label,
            simulation.subject || simulation.topicName || simulation.topic_name,
            contentDescription
          );
          
          for (const img of contentImages) {
            if (seenPaths.has(img.path)) continue;
            seenPaths.add(img.path);
            
            // Check if this image already has a shortcode (reuse existing)
            let uniqueShortcode = pathToShortcode[img.path];
            
            if (!uniqueShortcode) {
              // Generate new shortcode - ensure uniqueness
              uniqueShortcode = img.shortcode;
              let counter = 1;
              while (seenShortcodes.has(uniqueShortcode)) {
                uniqueShortcode = `${img.shortcode}_${counter}`;
                counter++;
              }
            } else {
              // Reuse existing shortcode
              console.log(`[image-list] Reusing existing shortcode "${uniqueShortcode}" for embedded image: ${img.path.substring(0, 50)}...`);
            }
            seenShortcodes.add(uniqueShortcode);
            
            // Resolve topic name from ID if needed
            let topicName = simulation.topicName || simulation.topic_name || img.topicName;
            let topicId = null;
            
            // Check if topic is an object (nested structure)
            if (simulation.topic && typeof simulation.topic === 'object') {
              if (simulation.topic.name) {
                topicName = simulation.topic.name;
              } else if (simulation.topic._id) {
                topicId = simulation.topic._id;
              }
            }
            
            // If topic is an object with a name property, use that
            if (topicName && typeof topicName === 'object' && topicName.name) {
              topicName = topicName.name;
            }
            // If topic is an ID, resolve it to a name
            else if (topicName && typeof topicName === 'string' && topicIdToName[topicName]) {
              topicName = topicIdToName[topicName];
            } else if (topicId && topicIdToName[topicId]) {
              topicName = topicIdToName[topicId];
            }

            // Resolve subject name from ID if needed (for embedded images)
            let embeddedSubjectName = simulation.subjectName || simulation.subject_name;
            let embeddedSubjectId = null;
            
            // Check if subject is an object (nested structure) - EXTRACT BOTH ID AND NAME
            if (simulation.subject && typeof simulation.subject === 'object') {
              // Extract ID if available (priority - needed for category detection)
              if (simulation.subject._id) {
                embeddedSubjectId = simulation.subject._id;
              } else if (simulation.subject.id) {
                embeddedSubjectId = simulation.subject.id;
              }
              // Extract name if available
              if (simulation.subject.name) {
                embeddedSubjectName = simulation.subject.name;
              }
            }
            // If subject is a string, it might be an ID
            else if (simulation.subject && typeof simulation.subject === 'string') {
              embeddedSubjectId = simulation.subject;
              // Try to resolve ID to name if possible
              if (subjectIdToName[embeddedSubjectId]) {
                embeddedSubjectName = subjectIdToName[embeddedSubjectId];
              }
            }
            
            // If subject is an object with a name property, use that
            if (embeddedSubjectName && typeof embeddedSubjectName === 'object' && embeddedSubjectName.name) {
              embeddedSubjectName = embeddedSubjectName.name;
            }
            // If subject is an ID string, resolve it to a name
            else if (embeddedSubjectName && typeof embeddedSubjectName === 'string' && subjectIdToName[embeddedSubjectName]) {
              if (!embeddedSubjectId) {
                embeddedSubjectId = embeddedSubjectName; // Store the ID before resolving
              }
              embeddedSubjectName = subjectIdToName[embeddedSubjectName];
            } else if (embeddedSubjectId && !embeddedSubjectName && subjectIdToName[embeddedSubjectId]) {
              embeddedSubjectName = subjectIdToName[embeddedSubjectId];
            }
            // Fallback: if we still don't have subjectId but have simulation.subject, try to extract it
            else if (!embeddedSubjectId && simulation.subject) {
              if (typeof simulation.subject === 'string') {
                embeddedSubjectId = simulation.subject;
                if (subjectIdToName[simulation.subject]) {
                  embeddedSubjectName = subjectIdToName[simulation.subject];
                }
              } else if (simulation.subject._id) {
                embeddedSubjectId = simulation.subject._id;
              } else if (simulation.subject.id) {
                embeddedSubjectId = simulation.subject.id;
              }
            }
            if (!embeddedSubjectId && simulation.subject) {
              if (typeof simulation.subject === 'string') {
                embeddedSubjectId = simulation.subject;
              } else if (simulation.subject && typeof simulation.subject === 'object' && simulation.subject._id) {
                embeddedSubjectId = simulation.subject._id;
              }
            }

            // Resolve chapter name from ID if needed
            let chapterName = simulation.chapterName || simulation.chapter_name || img.chapterName;
            let chapterId = null;
            
            // Check if chapter is an object (nested structure)
            if (simulation.chapter && typeof simulation.chapter === 'object') {
              if (simulation.chapter.name) {
                chapterName = simulation.chapter.name;
              } else if (simulation.chapter._id) {
                chapterId = simulation.chapter._id;
              }
            }
            
            // If chapter is an object with a name property, use that
            if (chapterName && typeof chapterName === 'object' && chapterName.name) {
              chapterName = chapterName.name;
            }
            // If chapter is an ID, resolve it to a name
            else if (chapterName && typeof chapterName === 'string' && chapterIdToName[chapterName]) {
              const originalChapterName = chapterName;
              chapterName = chapterIdToName[chapterName];
              console.log(`[image-list] Resolved chapter ID "${originalChapterName}" to name "${chapterName}"`);
            } else if (chapterId && chapterIdToName[chapterId]) {
              chapterName = chapterIdToName[chapterId];
              console.log(`[image-list] Resolved chapter ID "${chapterId}" to name "${chapterName}"`);
            } else if (chapterName && typeof chapterName === 'string' && chapterName.length > 20) {
              // Likely an ID that wasn't found in mapping
              console.warn(`[image-list] Chapter appears to be an ID but not found in mapping: "${chapterName.substring(0, 20)}..."`);
            }

            // Only add embedded images that have a valid category (filter out uncategorized)
            if (img.category) {
              allImages.push({
                ...img,
                shortcode: uniqueShortcode,
                description: contentDescription && typeof contentDescription === 'string' ? contentDescription : img.description,
                chapterName: chapterName || undefined,
                topicName: topicName || undefined,
                subjectName: embeddedSubjectName || undefined,
                subjectId: embeddedSubjectId || undefined,
              });
            }
          }
        }
      }

      console.log(`[image-list] ✅ Extracted ${allImages.length} images from simulations API`);
      
      // Save shortcodes to JSON file for frontend use
      // Note: figure-metadata.json is for AI (shortcodes only), image-shortcodes.json is for frontend (shortcodes + URLs)
      if (allImages.length > 0) {
        await saveShortcodesToFile(allImages);
      }
    } catch (apiError: any) {
      console.error('[image-list] ❌ Simulations API error:', apiError);
      console.error('[image-list] Error details:', {
        message: apiError.message,
        name: apiError.name,
        statusCode: apiError.statusCode,
        status: apiError.status,
        stack: apiError.stack?.substring(0, 500),
        cause: apiError.cause
      });
      
      // Throw error instead of returning empty result - no fallback
      const errorMessage = apiError.message || 'Unknown error';
      const statusCode = apiError.statusCode || apiError.status || 500;
      
      throw createError({
        statusCode: statusCode,
        message: `Failed to fetch images from simulations API: ${errorMessage}. Check that https://opschool.tie.go.tz:5001/v1/simulations is accessible and authentication is valid.`,
        cause: apiError,
      });
    }

    // If we still have no images, return empty result instead of error
    // This allows the page to load and show "no images found" message
    if (allImages.length === 0) {
      console.warn('[image-list] No images found from simulations API');
      return {
        success: true,
        total: 0,
        filtered: 0,
        filters: {
          category: categoryFilter || 'all',
          subjectId: subjectIdFilter || null,
          keyword: keyword || null,
          limit: limit || null,
        },
        byCategory: {
          biology: 0,
          physics: 0,
          chemistry: 0,
          mathematics: 0,
          geography: 0,
          horticulture: 0,
          english: 0,
          'leather-goods': 0,
        },
        images: [],
        message: 'No images found in simulations. The API may be empty or require authentication.',
      };
    }

    // Apply filters
    let filteredImages = allImages;

      // Filter by subject ID (if provided)
      if (subjectIdFilter) {
        const beforeCount = filteredImages.length;
        filteredImages = filteredImages.filter((img) => img.subjectId === subjectIdFilter);
        console.log(`[image-list] Subject ID filter "${subjectIdFilter}": ${beforeCount} → ${filteredImages.length} images`);
      }

      // Filter by category
      if (categoryFilter && ['biology', 'physics', 'chemistry', 'mathematics', 'geography', 'general'].includes(categoryFilter)) {
        filteredImages = filteredImages.filter((img) => img.category === categoryFilter);
      }

      // Filter by keyword
      if (keyword) {
        const keywordLower = keyword.toLowerCase();
        filteredImages = filteredImages.filter(
          (img) =>
            img.alt.toLowerCase().includes(keywordLower) ||
            img.path.toLowerCase().includes(keywordLower) ||
            img.shortcode.toLowerCase().includes(keywordLower) ||
            img.description?.toLowerCase().includes(keywordLower) ||
            img.chapterName?.toLowerCase().includes(keywordLower) ||
            img.topicName?.toLowerCase().includes(keywordLower)
        );
      }

      // Apply limit
      if (limit && limit > 0) {
        filteredImages = filteredImages.slice(0, limit);
      }

      // Group by category for easier browsing
      const byCategory = {
        biology: allImages.filter((img) => img.category === 'biology'),
        physics: allImages.filter((img) => img.category === 'physics'),
        chemistry: allImages.filter((img) => img.category === 'chemistry'),
        mathematics: allImages.filter((img) => img.category === 'mathematics'),
        geography: allImages.filter((img) => img.category === 'geography'),
        horticulture: allImages.filter((img) => img.category === 'horticulture'),
        english: allImages.filter((img) => img.category === 'english'),
        'leather-goods': allImages.filter((img) => img.category === 'leather-goods'),
        horticulture: allImages.filter((img) => img.category === 'horticulture'),
        english: allImages.filter((img) => img.category === 'english'),
        'leather-goods': allImages.filter((img) => img.category === 'leather-goods'),
      };

      return {
        success: true,
        total: allImages.length,
        filtered: filteredImages.length,
        filters: {
          category: categoryFilter || 'all',
          subjectId: subjectIdFilter || null,
          keyword: keyword || null,
          limit: limit || null,
        },
        byCategory: {
          biology: byCategory.biology.length,
          physics: byCategory.physics.length,
          chemistry: byCategory.chemistry.length,
          mathematics: byCategory.mathematics.length,
          geography: byCategory.geography.length,
          horticulture: byCategory.horticulture.length,
          english: byCategory.english.length,
          'leather-goods': byCategory['leather-goods'].length,
        },
        images: filteredImages,
        // Also provide categorized lists for convenience
        categories: byCategory,
      };
  } catch (error: any) {
    console.error('[image-list] Error:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to extract images',
    });
  }
});

