<template>
  <div class="flex justify-start animate-fade-in">
    <div class="flex gap-3 max-w-[85%]">
      <div class="w-8 h-8 bg-oceanBlue rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
        <Icon name="heroicons:bolt" class="w-5 h-5 text-white" />
      </div>

      <div class="bg-white text-gray-800 px-5 py-3 rounded-2xl rounded-tl-sm shadow-md border border-gray-100">
        <div v-for="(part, idx) in message.parts" :key="idx" class="space-y-2">
          <!-- Markdown Support with MathJax -->
          <!-- :key forces re-render when shortcodes finish loading from API -->
          <div 
            v-if="part.type === 'text'" 
            :key="`text-${idx}-${shortcodesLoaded}`"
            ref="mathContainer" 
            class="prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-semibold prose-h1:text-xl prose-h1:mt-4 prose-h1:mb-3 prose-h2:text-lg prose-h2:mt-3 prose-h2:mb-2 prose-h3:text-base prose-h3:mt-2 prose-h3:mb-1 prose-h4:text-sm prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5 prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-1 prose-li:pl-1 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-100 prose-pre:p-3 prose-pre:rounded-lg prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 prose-strong:font-semibold prose-em:italic" 
            role="log"
            aria-live="polite" 
            aria-relevant="additions" 
            aria-atomic="false" 
            v-html="processMathInText(part.text)"
            @click="handleLinkClick"
          >
          </div>

          <!-- Tool calls are hidden from the user - do not display them -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { ref, watch, nextTick, onMounted } from "vue";
import { getImageFromShortcode, loadDynamicShortcodes } from "~/utilities/imageShortcodes";
import { useRouter } from "vue-router";

const md = new MarkdownIt({ html: true, breaks: true, linkify: true });
const props = defineProps<{ message: any }>();
const mathContainer = ref<HTMLElement[]>([]);
const router = useRouter();
const shortcodesLoaded = ref(false); // Flag to force re-render when shortcodes are loaded

// Handle link clicks - prevent navigation for shortcode-like paths
const handleLinkClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.tagName === 'A') {
    const href = (target as HTMLAnchorElement).href;
    const pathname = new URL(href).pathname;
    
    // Check if this looks like a shortcode pattern (e.g., /biology_form1_figure_1_1 or /physics_figure_1_1)
    const shortcodePattern = /^\/[a-z]+(?:_form\d+)?_figure_(?:\d+_\d+|Sim\d+)(?:_[a-z])?$/i;
    if (shortcodePattern.test(pathname)) {
      event.preventDefault();
      event.stopPropagation();
      // Don't navigate - this is a false positive from linkify
      return false;
    }
  }
};

// Process math delimiters and image shortcodes - extract before markdown, restore after
const processMathInText = (text: string): string => {
  if (!text) return "";
  
  // Debug: Log if text contains shortcode patterns
  if (text.includes('_figure_')) {
    console.log('[MessageAI] Processing text with potential shortcodes:', text.substring(0, 200));
  }

  // Use unique placeholders that markdown won't modify
  const mathPlaceholders: Array<{ placeholder: string; replacement: string }> = [];
  const imagePlaceholders: Array<{ placeholder: string; replacement: string }> = [];
  let counter = 0;

  // Step 0: Detect and convert bare shortcodes to [image:shortcode] format
  // Pattern: standalone shortcodes like "biology_form1_figure_1_1" or "physics_figure_1_1" (not already in [image:] format)
  // This handles cases where AI produces bare shortcodes instead of [image:shortcode]
  // We need to check the context around each match to see if it's already in [image:] format
  // Patterns supported:
  // - biology_form1_figure_1_1 (subject_form#_figure_#_#)
  // - physics_figure_1_1 (subject_figure_#_#)
  // - physics_figure_Sim1 (subject_figure_Sim#)
  const bareShortcodePattern = /\b([a-z]+(?:_form\d+)?_figure_(?:\d+_\d+|Sim\d+)(?:_[a-z])?)\b/gi;
  let lastIndex = 0;
  const convertedText: string[] = [];
  
  let match: RegExpExecArray | null;
  while ((match = bareShortcodePattern.exec(text)) !== null) {
    const shortcode = match[1];
    if (!shortcode) {
      convertedText.push(match[0]);
      lastIndex = match.index + match[0].length;
      continue;
    }
    
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;
    
    // Add text before this match
    convertedText.push(text.substring(lastIndex, matchStart));
    
    // Check if this is already wrapped in [image:] format
    const beforeContext = text.substring(Math.max(0, matchStart - 20), matchStart);
    const afterContext = text.substring(matchEnd, Math.min(text.length, matchEnd + 10));
    
    // If it's already in [image:...] format, keep it as-is
    if (beforeContext.includes('[image:') && afterContext.includes(']')) {
      convertedText.push(match[0]);
    } else {
      // Convert bare shortcode to proper format - don't check cache since it might not be loaded yet
      // The image pattern handler below will resolve it (with async fallback if needed)
      console.log(`[MessageAI] Detected bare shortcode "${shortcode}" - converting to [image:${shortcode}] format`);
      convertedText.push(`[image:${shortcode}]`);
    }
    
    lastIndex = matchEnd;
  }
  
  // Add remaining text
  convertedText.push(text.substring(lastIndex));
  text = convertedText.join('');
  
  // Debug: Log after bare shortcode conversion
  if (text.includes('[image:')) {
    console.log('[MessageAI] After Step 0 (bare shortcode conversion), text has [image:] patterns');
  }

  // Step 1: Extract image shortcodes first (before markdown processing)
  // Pattern: [image:shortcode_name]
  const imagePattern = /\[image:([^\]]+)\]/g;
  text = text.replace(imagePattern, (match, shortcodeName) => {
    const imageMeta = getImageFromShortcode(shortcodeName.trim());
    const placeholder = `IMAGE_PLACEHOLDER_${counter}_END`;

    if (imageMeta) {
      let imageHtml: string;

      // Check if this is a multi-image figure (has paths array)
      if (imageMeta.paths && imageMeta.paths.length > 0) {
        // Render multiple images in a responsive grid
        const gridCols = Math.min(imageMeta.paths.length, 4);
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

        imageHtml = `<div class="my-4">
          <div class="grid grid-cols-2 md:grid-cols-${gridCols} gap-3">
            ${imageGrid}
          </div>
          <p class="text-center text-sm text-gray-600 mt-2 font-medium">${imageMeta.alt}</p>
        </div>`;
      } else {
        // Single image - generate image HTML with proper styling and accessibility
        // Images that fail to load will be silently hidden (no error message shown to users)
        imageHtml = `<div class="my-4 flex justify-center">
        <img 
          src="${imageMeta.path}" 
          alt="${imageMeta.alt}" 
          class="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
          loading="lazy"
          onerror="this.parentElement.style.display='none'; if(typeof console !== 'undefined' && console.warn) { console.warn('[MessageAI] Image failed to load:', '${imageMeta.path}'); }"
        />
      </div>`;
      }

      imagePlaceholders.push({
        placeholder,
        replacement: imageHtml
      });
    } else {
      // Shortcode not in cache - keep it as a placeholder so it can render when cache loads
      console.log(`[MessageAI] Image shortcode "${shortcodeName.trim()}" not in cache yet, keeping as placeholder`);
      // Return a visible placeholder that will be replaced on re-render when cache loads
      const placeholder = `IMAGE_PENDING_${counter}_END`;
      imagePlaceholders.push({
        placeholder,
        replacement: `<div class="my-4 p-4 bg-gray-100 rounded-lg text-center text-gray-500 animate-pulse" data-shortcode="${shortcodeName.trim()}">Loading image: ${shortcodeName.trim()}...</div>`
      });
      counter++;
      return placeholder;
    }

    counter++;
    return placeholder;
  });

  // Extract display math first ($$...$$ or \[...\])
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
    const placeholder = `MATHJAX_DISPLAY_PLACEHOLDER_${counter}_END`;
    mathPlaceholders.push({
      placeholder,
      replacement: `<div class="mathjax-display my-4">\\[${content.trim()}\\]</div>`
    });
    counter++;
    return placeholder;
  });

  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => {
    const placeholder = `MATHJAX_DISPLAY_PLACEHOLDER_${counter}_END`;
    mathPlaceholders.push({
      placeholder,
      replacement: `<div class="mathjax-display my-4">\\[${content.trim()}\\]</div>`
    });
    counter++;
    return placeholder;
  });

  // Extract inline math ($...$ or \(...\))
  // Process $...$ but avoid matching $$ (already processed)
  text = text.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (match, content) => {
    const placeholder = `MATHJAX_INLINE_PLACEHOLDER_${counter}_END`;
    mathPlaceholders.push({
      placeholder,
      replacement: `<span class="mathjax-inline">\\(${content.trim()}\\)</span>`
    });
    counter++;
    return placeholder;
  });

  text = text.replace(/\\\(([^)]+?)\\\)/g, (match, content) => {
    const placeholder = `MATHJAX_INLINE_PLACEHOLDER_${counter}_END`;
    mathPlaceholders.push({
      placeholder,
      replacement: `<span class="mathjax-inline">\\(${content.trim()}\\)</span>`
    });
    counter++;
    return placeholder;
  });

  // Step 2: Now render markdown (placeholders will pass through as plain text)
  let rendered = md.render(text);

  // Step 2.5: Fix linkify issue - remove links that match shortcode patterns and render images directly
  // MarkdownIt's linkify may convert bare shortcodes into links like <a href="/biology_form1_figure_1_1">...</a>
  // We need to remove these false-positive links and render the actual images
  // Expanded pattern to match: biology_form1_figure_1_1, physics_figure_1_1, physics_figure_Sim1
  rendered = rendered.replace(
    /<a\s+href="\/([a-z]+(?:_form\d+)?_figure_(?:\d+_\d+|Sim\d+)(?:_[a-z])?)"[^>]*>[^<]*<\/a>/gi,
    (match, shortcode) => {
      console.log(`[MessageAI] Detected linkified shortcode "${shortcode}" - rendering image directly`);
      const imageMeta = getImageFromShortcode(shortcode);
      if (imageMeta) {
        // Render the image directly
        if (imageMeta.paths && imageMeta.paths.length > 0) {
          // Multi-image figure
          const gridCols = Math.min(imageMeta.paths.length, 4);
          const imageGrid = imageMeta.paths.map((imgPath, idx) => {
            const altText = imageMeta.alts?.[idx] || imageMeta.alt;
            return `<div class="flex flex-col items-center">
              <img src="${imgPath}" alt="${altText}" class="max-w-full h-auto rounded-lg shadow-md border border-gray-200" loading="lazy" onerror="this.parentElement.style.display='none';" />
              <span class="text-xs text-gray-500 mt-1">${altText}</span>
            </div>`;
          }).join('');
          return `<div class="my-4"><div class="grid grid-cols-2 md:grid-cols-${gridCols} gap-3">${imageGrid}</div><p class="text-center text-sm text-gray-600 mt-2 font-medium">${imageMeta.alt}</p></div>`;
        } else if (imageMeta.path) {
          // Single image
          return `<div class="my-4 flex justify-center"><img src="${imageMeta.path}" alt="${imageMeta.alt}" class="max-w-full h-auto rounded-lg shadow-md border border-gray-200" loading="lazy" onerror="this.parentElement.style.display='none';" /></div>`;
        }
      }
      // If shortcode not in cache, return empty (image will appear on re-render when cache loads)
      console.log(`[MessageAI] Shortcode "${shortcode}" not in cache yet, will render on next update`);
      return `<!-- pending image: ${shortcode} -->`;
    }
  );

  // Step 3: Restore image shortcodes as HTML img tags
  imagePlaceholders.forEach(({ placeholder, replacement }) => {
    // Escape special regex characters in placeholder
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPlaceholder, 'g');
    rendered = rendered.replace(regex, replacement);
  });

  // Step 4: Restore math formulas
  mathPlaceholders.forEach(({ placeholder, replacement }) => {
    // Escape special regex characters in placeholder
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPlaceholder, 'g');
    rendered = rendered.replace(regex, replacement);
  });

  return rendered;
};

// Render MathJax after content is updated
const renderMathJax = async () => {
  if (import.meta.server) return;

  await nextTick();

  if (window.mathJaxLoaded && window.MathJaxRender) {
    try {
      await window.mathJaxLoaded;
      // Get all math containers
      const containers = Array.isArray(mathContainer.value)
        ? mathContainer.value
        : mathContainer.value
          ? [mathContainer.value]
          : [];

      if (containers.length > 0) {
        await window.MathJaxRender(containers);
      }
    } catch (error) {
      console.warn("MathJax rendering failed:", error);
    }
  }
};

// Watch for message changes and render MathJax
watch(() => props.message, () => {
  renderMathJax();
}, { deep: true });

onMounted(async () => {
  // Pre-load dynamic shortcodes from API
  console.log('[MessageAI] Loading shortcodes...');
  await loadDynamicShortcodes();
  console.log('[MessageAI] Shortcodes loaded, triggering re-render');
  shortcodesLoaded.value = true; // Trigger re-render
  renderMathJax();
});
</script>
