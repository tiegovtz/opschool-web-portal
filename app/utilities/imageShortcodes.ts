/**
 * Image Shortcode Registry
 * 
 * All image shortcodes are now loaded dynamically from the external Figures API.
 * Used by the AI Teacher to include images in responses using shortcodes like [image:biology_cell_structure]
 * 
 * Supports both single images (path) and multi-image figures (paths array)
 */

export interface ImageMetadata {
  path?: string;           // Single image URL (for single-image figures)
  paths?: string[];        // Multiple image URLs (for multi-image figures like Figure 1.1 with a,b,c,d)
  alt: string;             // Combined alt text
  alts?: string[];         // Individual alt texts for each sub-image
  category: 'biology' | 'physics' | 'chemistry' | 'mathematics' | 'general';
}

// Cache for dynamic shortcodes loaded from API
let dynamicShortcodesCache: Record<string, ImageMetadata> = {};
let cacheLoadPromise: Promise<void> | null = null;

/**
 * Clear the shortcodes cache
 */
export function clearShortcodesCache(): void {
  dynamicShortcodesCache = {};
  cacheLoadPromise = null;
  // Also clear API cache
  import('~/utilities/figuresApi').then(({ clearFiguresCache }) => {
    clearFiguresCache();
  }).catch(() => {
    // Ignore if module not available
  });
}

/**
 * Pre-load all dynamic shortcodes from API (call this on app init or component mount)
 * @param forceReload - If true, clears cache and reloads even if already loaded
 */
export async function loadDynamicShortcodes(forceReload: boolean = false): Promise<void> {
  // Clear cache if force reload is requested
  if (forceReload) {
    clearShortcodesCache();
  }
  
  // Only load once unless force reload
  if (cacheLoadPromise && !forceReload) {
    return cacheLoadPromise;
  }

  cacheLoadPromise = (async () => {
    try {
      // Load all shortcodes from our server endpoint (handles auth internally)
      const response = await fetch('/api/image-list');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.images && data.images.length > 0) {
        // Convert to cache format - supports both single and multi-image figures.
        // Include parent entries (paths only) so [image:parent_shortcode] resolves reliably.
        for (const figure of data.images) {
          const metadata: ImageMetadata = {
            alt: figure.alt || '',
            category: (figure.category as ImageMetadata['category']) || 'general'
          };
          
          // Handle single image path
          if (figure.path) {
            metadata.path = figure.path;
          }
          
          // Handle multi-image figures (paths array) – keep parent shortcodes with paths only
          if (figure.paths && figure.paths.length > 0) {
            metadata.paths = figure.paths;
            metadata.alts = figure.alts || [];
          }
          
          if (figure.shortcode) {
            dynamicShortcodesCache[figure.shortcode] = metadata;
          }
        }
      } else {
        console.warn('[imageShortcodes] No figures returned from server:', data);
      }
    } catch (error) {
      console.warn('[imageShortcodes] Failed to load dynamic shortcodes:', error);
      // Silently fail - direct paths will still work as fallback
    }
  })();

  return cacheLoadPromise;
}

/**
 * Get image metadata from shortcode name (synchronous - checks cache only)
 * @param shortcodeName - The shortcode name (e.g., 'biology_cell_structure_diagram') or direct image path/URL
 * @returns ImageMetadata or null if not found in cache
 */
export const getImageFromShortcode = (shortcodeName: string): ImageMetadata | null => {
  const trimmed = shortcodeName.trim();
  
  // Check cache for dynamic shortcodes (loaded from API)
  if (dynamicShortcodesCache[trimmed]) {
    return dynamicShortcodesCache[trimmed];
  }
  
  // If not found, check if this is a parent shortcode for a multi-image figure
  // e.g., "physics_figure_1_1" should find "physics_figure_1_1_a", "physics_figure_1_1_b", etc.
  const childShortcodes = Object.keys(dynamicShortcodesCache).filter(
    key => key.startsWith(trimmed + '_') && key.match(new RegExp(`^${trimmed}_[a-z]$`))
  );
  
  if (childShortcodes.length > 0) {
    // Found child images - combine them into a multi-image figure
    const paths: string[] = [];
    const alts: string[] = [];
    
    // Sort alphabetically to maintain order (a, b, c, d)
    childShortcodes.sort().forEach(childKey => {
      const child = dynamicShortcodesCache[childKey];
      if (child?.path) {
        paths.push(child.path);
        alts.push(child.alt || '');
      }
    });
    
    if (paths.length > 0) {
      const firstChild = childShortcodes[0];
      return {
        paths,
        alts,
        alt: `Figure ${trimmed}`,
        category:
          (firstChild ? dynamicShortcodesCache[firstChild]?.category : undefined) ||
          'general'
      };
    }
  }
  
  // If not found, check if it's a direct path/URL (from chapter images or tool)
  if (
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') || 
    trimmed.startsWith('/') ||
    trimmed.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
  ) {
    return {
      path: trimmed,
      alt: 'Educational diagram from lesson content',
      category: 'general'
    };
  }
  
  return null;
};

/**
 * Get image metadata from shortcode name (async - fetches from API if not in cache)
 * @param shortcodeName - The shortcode name (e.g., 'biology_cell_structure_diagram') or direct image path/URL
 * @returns ImageMetadata or null if not found
 */
export const getImageFromShortcodeAsync = async (shortcodeName: string): Promise<ImageMetadata | null> => {
  const trimmed = shortcodeName.trim();
  
  // First check cache (synchronous)
  const cached = getImageFromShortcode(trimmed);
  if (cached) {
    return cached;
  }
  
  // If not in cache, try to fetch from API (async lookup)
  try {
    const { getFigureByShortcode } = await import('~/utilities/figuresApi');
    const figure = await getFigureByShortcode(trimmed);
    
    if (figure) {
      const metadata: ImageMetadata = {
        alt: figure.alt,
        category: figure.category as ImageMetadata['category']
      };
      
      if (figure.paths && figure.paths.length > 0) {
        metadata.paths = figure.paths;
        metadata.alts = figure.alts;
      } else if (figure.path) {
        metadata.path = figure.path;
      }
      
      // Cache it for future use
      dynamicShortcodesCache[trimmed] = metadata;
      return metadata;
    }
  } catch (error) {
    // Silently fail and continue to direct path check
  }
  
  // If not found, check if it's a direct path/URL (from chapter images or tool)
  if (
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') || 
    trimmed.startsWith('/') ||
    trimmed.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
  ) {
    return {
      path: trimmed,
      alt: 'Educational diagram from lesson content',
      category: 'general'
    };
  }
  
  return null;
};

/**
 * Get all available shortcode names (from dynamic cache)
 * @returns Array of shortcode names
 */
export const getAvailableShortcodes = (): string[] => {
  return Object.keys(dynamicShortcodesCache);
};

/**
 * Get shortcodes filtered by category (from dynamic cache)
 * @param category - The category to filter by
 * @returns Array of shortcode names in that category
 */
export const getShortcodesByCategory = (category: ImageMetadata['category']): string[] => {
  return Object.entries(dynamicShortcodesCache)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([shortcode]) => shortcode);
};

/**
 * Replace all image shortcodes in text with image HTML
 * @param text - Text containing shortcodes like [image:biology_cell_structure]
 * @returns Text with shortcodes replaced by HTML img tags
 * Supports both single images and multi-image figures (renders all images in a grid)
 */
export const replaceImageShortcodes = (text: string): string => {
  if (!text) return text;

  // Pattern: [image:shortcode_name]
  const imagePattern = /\[image:([^\]]+)\]/g;

  return text.replace(imagePattern, (match, shortcodeName) => {
    const imageMeta = getImageFromShortcode(shortcodeName.trim());

    if (!imageMeta) {
      // If image not found, return placeholder text in development, original shortcode in production
      if (import.meta.dev) {
        return `<span class="text-gray-400 italic text-sm">[Image not found: ${shortcodeName.trim()}]</span>`;
      }
      return match; // Return original shortcode if not found
    }

    // Check if this is a multi-image figure
    if (imageMeta.paths && imageMeta.paths.length > 0) {
      // Render multiple images in a responsive grid
      const imageGrid = imageMeta.paths.map((imgPath, idx) => {
        const altText = imageMeta.alts?.[idx] || imageMeta.alt;
        return `<div class="flex flex-col items-center">
          <img 
            src="${imgPath}" 
            alt="${altText}" 
            class="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
            loading="lazy"
            onerror="this.parentElement.style.display='none';"
          />
          <span class="text-xs text-gray-500 mt-1">${altText}</span>
        </div>`;
      }).join('');
      
      return `<div class="my-4">
        <div class="grid grid-cols-2 md:grid-cols-${Math.min(imageMeta.paths.length, 4)} gap-3">
          ${imageGrid}
        </div>
        <p class="text-center text-sm text-gray-600 mt-2">${imageMeta.alt}</p>
      </div>`;
    }

    // Single image - return image HTML with proper styling and accessibility
    return `<div class="my-4 flex justify-center">
      <img 
        src="${imageMeta.path}" 
        alt="${imageMeta.alt}" 
        class="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
        loading="lazy"
        onerror="this.style.display='none'; this.nextElementSibling?.style.display='block';"
      />
      <span class="hidden text-gray-400 italic text-sm">Image not available: ${imageMeta.alt}</span>
    </div>`;
  });
};
