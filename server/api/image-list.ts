import { setHeader, getQuery, getCookie } from "h3";

/**
 * Generate images array from shortcodes object
 * This ensures images array is always in sync with shortcodes object
 * Multi-image figures are included with their paths array AND expanded into separate entries for display
 */
function generateImagesFromShortcodes(shortcodes: Record<string, any>): Array<{
  alt: string;
  shortcode: string;
  category: string;
  description?: string;
  chapterName?: string;
  topicName?: string;
  path?: string;
  paths?: string[];
  alts?: string[];
  isPartOfMultiImage?: boolean;
  parentShortcode?: string;
  imageIndex?: number;
}> {
  const result: Array<{
    alt: string;
    shortcode: string;
    category: string;
    description?: string;
    chapterName?: string;
    topicName?: string;
    path?: string;
    paths?: string[];
    alts?: string[];
    isPartOfMultiImage?: boolean;
    parentShortcode?: string;
    imageIndex?: number;
  }> = [];

  for (const [shortcode, metadata] of Object.entries(shortcodes)) {
    const isMultiImage = Array.isArray(metadata.paths) && metadata.paths.length > 0;
    
    if (isMultiImage) {
      const paths = metadata.paths as string[];
      const alts = (metadata.alts as string[]) || [];
      
      // FIRST: Add the parent shortcode entry with paths array (for AI shortcode resolution)
      result.push({
        alt: metadata.alt || '',
        shortcode: shortcode,
        category: metadata.category || 'biology',
        description: metadata.description,
        chapterName: metadata.chapterName,
        topicName: metadata.topicName,
        paths: paths,
        alts: alts,
      });
      
      // THEN: Expand multi-image figure into separate entries (for image-list display)
      paths.forEach((path: string, index: number) => {
        // Generate sub-shortcode like biology_form1_figure_1_1_a, biology_form1_figure_1_1_b, etc.
        const subLetter = String.fromCharCode(97 + index); // 'a', 'b', 'c', 'd'...
        const subShortcode = `${shortcode}_${subLetter}`;
        
        result.push({
          alt: alts[index] || `${metadata.alt || ''} (part ${index + 1})`,
          shortcode: subShortcode,
          category: metadata.category || 'biology',
          description: metadata.description,
          chapterName: metadata.chapterName,
          topicName: metadata.topicName,
          path: path,
          isPartOfMultiImage: true,
          parentShortcode: shortcode,
          imageIndex: index,
        });
      });
    } else {
      // Single image entry
      result.push({
        alt: metadata.alt || '',
        shortcode: shortcode,
        category: metadata.category || 'biology',
        description: metadata.description,
        chapterName: metadata.chapterName,
        topicName: metadata.topicName,
        path: metadata.path || '',
      });
    }
  }

  return result;
}

// =============================================================================
// LEGACY JSON FILE CODE - COMMENTED OUT (Now using Figures API)
// =============================================================================
// The following functions were used when figures were stored in local JSON files:
// - saveShortcodesToFile()
// - generateShortcodeFromDescription()
// - extractImagesFromContent()
// 
// These have been replaced by the Figures API at https://opschool.tie.go.tz:5001/v1/figures
// See server/utils/figuresApi.ts for the API client implementation.
// =============================================================================

export default defineEventHandler(async (event) => {
  try {
    // Set cache-control headers to prevent browser caching
    setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate');
    setHeader(event, 'Pragma', 'no-cache');
    setHeader(event, 'Expires', '0');
    
    // Get query parameters
    const query = getQuery(event);
    const categoryFilter = query.category as string | undefined;
    const subjectIdFilter = query.subjectId as string | undefined;
    const limit = query.limit ? parseInt(query.limit as string) : undefined;
    const keyword = query.keyword as string | undefined;

    // Get auth token from cookie
    const authToken = getCookie(event, "signInAccessToken") ||
                      event.headers.get("authorization")?.replace("Bearer ", "").trim() ||
                      undefined;

    // Fetch figures from API
    try {
      const { getFigures } = await import('../utils/figuresApi');
      console.log('[image-list] Fetching figures from API...', { hasAuthToken: !!authToken });
      const figures = await getFigures({}, authToken);
      
      console.log('[image-list] API response:', { 
        figuresCount: figures?.length || 0, 
        hasFigures: !!figures,
        isArray: Array.isArray(figures),
        firstFigure: figures && figures.length > 0 ? {
          shortcode: figures[0].shortcode,
          hasPath: !!figures[0].path,
          hasPaths: Array.isArray(figures[0].paths) && figures[0].paths.length > 0,
          category: figures[0].category,
        } : null
      });
      
      if (figures && figures.length > 0) {
        // Convert API figures to shortcodes format for generateImagesFromShortcodes
        const shortcodes: Record<string, any> = {};
        let skippedCount = 0;
        for (const figure of figures) {
          // Skip figures that don't have any image paths
          if (!figure.path && (!Array.isArray(figure.paths) || figure.paths.length === 0)) {
            console.warn(`[image-list] Skipping figure ${figure.shortcode} - no path or paths`);
            skippedCount++;
            continue;
          }
          
          shortcodes[figure.shortcode] = {
            alt: figure.alt || '',
            category: figure.category || 'general',
            description: figure.description,
            chapterName: figure.chapterName,
            topicName: figure.topicName,
            subjectName: figure.subjectName,
            path: figure.path,
            paths: figure.paths,
            alts: figure.alts,
          };
        }
        
        if (skippedCount > 0) {
          console.log(`[image-list] Skipped ${skippedCount} figures without image paths`);
        }
        
        console.log(`[image-list] Converted ${Object.keys(shortcodes).length} figures to shortcodes format`);
        
        const imagesArray = generateImagesFromShortcodes(shortcodes);
        
        // Count only displayable images (those with a single path, not parent entries with paths array)
        const displayableImages = imagesArray.filter(img => img.path && !img.paths);
        
        console.log(`[image-list] ✅ Fetched ${figures.length} figures from API, generated ${displayableImages.length} displayable images at ${new Date().toISOString()}.`);
        
        let filteredImages = displayableImages;
        
        // Apply filters
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
        
        // Calculate byCategory from figures
        const byCategory: Record<string, number> = {};
        figures.forEach(fig => {
          const cat = fig.category || 'general';
          byCategory[cat] = (byCategory[cat] || 0) + 1;
        });
        
        return {
          success: true,
          total: displayableImages.length,
          filtered: filteredImages.length,
          filters: {
            category: categoryFilter || 'all',
            subjectId: subjectIdFilter || null,
            keyword: keyword || null,
            limit: limit || null,
          },
          byCategory: byCategory,
          images: filteredImages,
          cached: false,
          responseTimestamp: Date.now(),
          message: 'Data fetched from Figures API.',
        };
      } else {
        // No figures found in API - return empty result
        console.log('[image-list] No figures found in API');
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
          byCategory: {},
          images: [],
          cached: false,
          responseTimestamp: Date.now(),
          message: 'No figures found in API.',
        };
      }
    } catch (apiError: any) {
      console.error('[image-list] Failed to fetch from Figures API:', apiError.message);
      // Return error instead of falling back to local JSON
      throw createError({
        statusCode: apiError.statusCode || 500,
        message: `Failed to fetch figures from API: ${apiError.message || 'Unknown error'}`,
        cause: apiError,
      });
    }
  } catch (error: any) {
    console.error('[image-list] Error:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch images',
    });
  }
});
