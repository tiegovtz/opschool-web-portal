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

          <!-- Tools -->
          <pre
            v-if="part.type.startsWith('tool-')"
            class="text-xs bg-gray-50 p-3 rounded-lg mt-2 overflow-x-auto border border-gray-200"
          >
            {{ JSON.stringify(part, null, 2) }}
          </pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { ref, watch, nextTick, onMounted } from "vue";

const md = new MarkdownIt({ html: true, breaks: true, linkify: true });
const props = defineProps<{ message: any }>();
const mathContainer = ref<HTMLElement[]>([]);

// Process math delimiters - extract before markdown, restore after
const processMathInText = (text: string): string => {
  if (!text) return "";
  
  // Use a unique placeholder that markdown won't modify
  const mathPlaceholders: Array<{ placeholder: string; replacement: string }> = [];
  let counter = 0;
  
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
  
  // Now render markdown (placeholders will pass through as plain text)
  let rendered = md.render(text);
  
  // Restore math formulas
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

onMounted(() => {
  renderMathJax();
});
</script>
