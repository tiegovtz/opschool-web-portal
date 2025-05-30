<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import * as pdfjsLib from "pdfjs-dist";
import "../../utilities/pdfjsWorker"; // Import the worker setup

const props = defineProps({
    pdfUrl: {
        type: String,
        required: true,
    }
});

const pdfCanvas = ref(null);
const wrapper = ref(null);
const errorMessage = ref("");
const totalPages = ref(0);
const currentPage = ref(1);
let pdfDocument = null;

const loadPDF = async () => {
    const url = props.pdfUrl;

    try {
        // Load the PDF document
        pdfDocument = await pdfjsLib.getDocument(url).promise;
        totalPages.value = pdfDocument.numPages;

        // Wait for DOM to be ready then render
        await nextTick();
        renderPage(currentPage.value);
    } catch (error) {
        currentPage.value = 0;
        console.error("Error loading PDF:", error["message"]);
        errorMessage.value = "Error while loading PDF";
    }
};

const renderPage = async (pageNumber) => {
    if (!pdfDocument || !pdfCanvas.value || !wrapper.value) return;

    const canvas = pdfCanvas.value;
    const ctx = canvas.getContext("2d");

    try {
        const page = await pdfDocument.getPage(pageNumber);
        
        // Get the original viewport at scale 1
        const originalViewport = page.getViewport({ scale: 1 });
        
        // Get container dimensions with some padding
        const containerRect = wrapper.value.getBoundingClientRect();
        const availableWidth = containerRect.width - 32; // Account for padding
        const availableHeight = Math.max(containerRect.height - 32, window.innerHeight * 0.6);
        
        // Calculate scale to fit container while maintaining aspect ratio
        const scaleX = availableWidth / originalViewport.width;
        const scaleY = availableHeight / originalViewport.height;
        const scale = Math.min(scaleX, scaleY, 2); // Max scale of 2 for quality
        
        // Get the scaled viewport
        const viewport = page.getViewport({ scale });
        
        // Set canvas dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Set canvas style dimensions for responsive display
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';

        // Clear previous content
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render the page
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
        };
        
        await page.render(renderContext).promise;
    } catch (error) {
        currentPage.value = 0;
        console.error("Error rendering page:", error);
        errorMessage.value = "Error while rendering page PDF";
    }
};

const previousPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
        renderPage(currentPage.value);
    }
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
        renderPage(currentPage.value);
    }
};

// Handle window resize
const handleResize = () => {
    if (pdfDocument && currentPage.value > 0) {
        // Debounce resize events
        clearTimeout(handleResize.timeoutId);
        handleResize.timeoutId = setTimeout(() => {
            renderPage(currentPage.value);
        }, 250);
    }
};

onMounted(() => {
    loadPDF();
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (handleResize.timeoutId) {
        clearTimeout(handleResize.timeoutId);
    }
});

// Watch for prop changes
watch(
    () => props.pdfUrl,
    () => {
        loadPDF();
        errorMessage.value = "";
        currentPage.value = 1;
        totalPages.value = 0;
    }
);
</script>

<template>
    <div class="flex flex-col w-full min-h-screen">
        <!-- PDF Container -->
        <div 
            ref="wrapper"
            class="flex items-center justify-center overflow-auto"
        >
            <div class="flex justify-center w-full max-w-full">
                <canvas
                    ref="pdfCanvas"
                    style="image-rendering: auto; max-width: 100%; height: auto;"
                />
            </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-4 text-center text-red-500">
            {{ errorMessage }}
        </div>

        <!-- Navigation Controls -->
        <div class="sticky bottom-0 flex items-center justify-center gap-4 p-4 ">
            <button 
                @click="previousPage" 
                :disabled="currentPage === 1"
                class="flex items-center justify-center p-2 transition-colors rounded-lg"
                :class="currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'"
            >
                <Icon name="iconamoon:arrow-left-2-duotone" size="1.5rem" />
                <span class="hidden ml-1 sm:inline">Previous</span>
            </button>
            
            <div class="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <span class="text-sm font-medium">
                    Page {{ currentPage }} of {{ totalPages }}
                </span>
            </div>
            
            <button 
                @click="nextPage" 
                :disabled="currentPage >= totalPages"
                class="flex items-center justify-center p-2 transition-colors rounded-lg"
                :class="currentPage >= totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'"
            >
                <span class="hidden mr-1 sm:inline">Next</span>
                <Icon name="iconamoon:arrow-right-2-duotone" size="1.5rem" />
            </button>
        </div>
    </div>
</template>