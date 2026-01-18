/**
 * Image Shortcode Registry
 * 
 * Maps image shortcode names to actual image paths in the public/images directory.
 * Used by the AI Teacher to include images in responses using shortcodes like [image:biology_cell_structure]
 */

export interface ImageMetadata {
  path: string;
  alt: string;
  category: 'biology' | 'physics' | 'chemistry' | 'mathematics' | 'general';
}

/**
 * Image shortcode mapping registry
 * Maps shortcode names to image metadata
 */
export const imageShortcodes: Record<string, ImageMetadata> = {
  // Biology images
  'biology_cell_structure': {
    path: '/images/biology_cell_structure.webp',
    alt: 'Cell structure diagram showing organelles',
    category: 'biology'
  },
  'biology_dna_structure': {
    path: '/images/biology_dna_structure.webp',
    alt: 'DNA double helix structure',
    category: 'biology'
  },
  'biology_digestive_system': {
    path: '/images/biology_digestive_system.webp',
    alt: 'Human digestive system diagram',
    category: 'biology'
  },
  'biology_plant_leaf': {
    path: '/images/biology_plant_leaf.webp',
    alt: 'Plant leaf structure and photosynthesis',
    category: 'biology'
  },
  'biology_ecosystem': {
    path: '/images/biology_ecosystem.webp',
    alt: 'Ecosystem diagram showing food chain',
    category: 'biology'
  },

  // Physics images
  'physics_wave_diagram': {
    path: '/images/physics_wave_diagram.webp',
    alt: 'Wave diagram showing amplitude and wavelength',
    category: 'physics'
  },
  'physics_circuit_diagram': {
    path: '/images/physics_circuit_diagram.webp',
    alt: 'Electrical circuit diagram',
    category: 'physics'
  },
  'physics_force_diagram': {
    path: '/images/physics_force_diagram.webp',
    alt: 'Force diagram showing vectors',
    category: 'physics'
  },
  'physics_motion_graph': {
    path: '/images/physics_motion_graph.webp',
    alt: 'Motion graph showing velocity and acceleration',
    category: 'physics'
  },
  'physics_general': {
    path: '/images/physics.jpeg',
    alt: 'Physics illustration',
    category: 'physics'
  },

  // Chemistry images
  'chemistry_molecule_structure': {
    path: '/images/chemistry_molecule_structure.webp',
    alt: 'Molecular structure diagram',
    category: 'chemistry'
  },
  'chemistry_periodic_table': {
    path: '/images/chemistry_periodic_table.webp',
    alt: 'Periodic table of elements',
    category: 'chemistry'
  },
  'chemistry_reaction_diagram': {
    path: '/images/chemistry_reaction_diagram.webp',
    alt: 'Chemical reaction diagram',
    category: 'chemistry'
  },

  // Mathematics images
  'math_graph_example': {
    path: '/images/math_graph_example.webp',
    alt: 'Mathematical graph example',
    category: 'mathematics'
  },
  'math_geometry_shape': {
    path: '/images/math_geometry_shape.webp',
    alt: 'Geometric shapes and angles',
    category: 'mathematics'
  },
  'math_equation_visualization': {
    path: '/images/math_equation_visualization.webp',
    alt: 'Equation visualization',
    category: 'mathematics'
  },

  // General/Default
  'default': {
    path: '/images/default.webp',
    alt: 'Educational diagram',
    category: 'general'
  },
  'diagram_placeholder': {
    path: '/images/default.webp',
    alt: 'Diagram placeholder',
    category: 'general'
  }
};

/**
 * Get image metadata from shortcode name
 * @param shortcodeName - The shortcode name (e.g., 'biology_cell_structure')
 * @returns ImageMetadata or null if not found
 */
export const getImageFromShortcode = (shortcodeName: string): ImageMetadata | null => {
  const trimmed = shortcodeName.trim();
  return imageShortcodes[trimmed] || null;
};

/**
 * Get all available shortcode names
 * @returns Array of shortcode names
 */
export const getAvailableShortcodes = (): string[] => {
  return Object.keys(imageShortcodes);
};

/**
 * Get shortcodes filtered by category
 * @param category - The category to filter by
 * @returns Array of shortcode names in that category
 */
export const getShortcodesByCategory = (category: ImageMetadata['category']): string[] => {
  return Object.entries(imageShortcodes)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([shortcode]) => shortcode);
};

/**
 * Replace all image shortcodes in text with image HTML
 * @param text - Text containing shortcodes like [image:biology_cell_structure]
 * @returns Text with shortcodes replaced by HTML img tags
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

    // Return image HTML with proper styling and accessibility
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

