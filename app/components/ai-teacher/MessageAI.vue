<template>
  <div class="flex justify-start animate-fade-in">
    <div class="flex gap-3 max-w-[85%]">
      <div
        class="w-8 h-8 bg-oceanBlue rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md"
      >
        <Icon
          name="heroicons:bolt"
          class="w-5 h-5 text-white"
        />
      </div>

      <div
        class="bg-white text-gray-800 px-5 py-3 rounded-2xl rounded-tl-sm shadow-md border border-gray-100"
      >
        <div
          v-for="(part, idx) in message.parts"
          :key="idx"
          class="space-y-2"
        >
          <!-- Markdown Support with MathJax -->
          <div
            v-if="part.type === 'text'"
            ref="mathContainer"
            class="prose prose-sm max-w-none"
            v-html="processMathInText(part.text)"
          ></div>

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

const md = new MarkdownIt({ html: true, breaks: true, linkify: true });
const props = defineProps<{ message: any }>();
const mathContainer = ref<HTMLElement[]>([]);

// Process math delimiters and image shortcodes - extract before markdown, restore after
const processMathInText = (text: string): string => {
  if (!text) return "";
  
  // Use unique placeholders that markdown won't modify
  const mathPlaceholders: Array<{ placeholder: string; replacement: string }> = [];
  const imagePlaceholders: Array<{ placeholder: string; replacement: string }> = [];
  let counter = 0;
  
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
      // Log to server only, don't show to users
      if (import.meta.server) {
        console.warn(`[MessageAI] Image shortcode not found: ${shortcodeName.trim()}`);
      }
      // Return empty string - fail silently for users (don't create placeholder)
      return '';
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
  // Pre-load dynamic shortcodes from JSON file
  await loadDynamicShortcodes();
  renderMathJax();
});
</script>
