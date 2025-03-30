<template>
    <div class="flex flex-col items-center justify-center ">
        <div class="flex items-center justify-center w-full ">
            <canvas ref="pdfCanvas" class=""></canvas>
        </div>
        <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>


        <div class="flex items-center justify-center">
            <button class="flex items-center justify-center" @click="previousPage" :disabled="currentPage === 1">
                <Icon name="iconamoon:arrow-left-2-duotone" class="" size="1.5rem" />
            </button>
            <p>Page {{ currentPage }} of {{ totalPages }}</p>
            <button @click="nextPage" class="flex items-center justify-center">
                <Icon name="iconamoon:arrow-right-2-duotone" class="" size="1.5rem" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import * as pdfjsLib from "pdfjs-dist";
import "../../utilities/pdfjsWorker"; // Import the worker setup

const props = defineProps({
    pdfUrl: {
        type: String,
        required: true,
    }
});

const pdfCanvas = ref(null);
const errorMessage = ref("");
const totalPages = ref(0);
const currentPage = ref(1)// Store the current page number
// Store the total number of pages
let pdfDocument = null; // Store the loaded PDF document reference

const loadPDF = async () => {
    const url = props.pdfUrl;

    try {
        // Load the PDF document
        pdfDocument = await pdfjsLib.getDocument(url).promise;
        totalPages.value = pdfDocument.numPages;

        // Render the first page initially
        renderPage(currentPage.value);
    } catch (error) {
        currentPage.value = 0
        console.error("Error loading PDF:", error["message"]);
        errorMessage.value = "Error while loading PDF";
    }
};

const renderPage = async (pageNumber) => {
    const canvas = pdfCanvas.value;
    const ctx = canvas?.getContext("2d");

    try {
        const page = await pdfDocument.getPage(pageNumber);
        // Get the original viewport
        const originalViewport = page.getViewport({ scale: 1 });
        // Get the width and height of the container (e.g., full screen width)
        const containerWidth = canvas.parentElement.clientWidth;
        const containerHeight = canvas.parentElement.clientHeight;

        // Calculate the scale to fit the container width and height
        const scale = Math.min(
            containerWidth / originalViewport.width,
            containerHeight / originalViewport.height
        );

        // Get the scaled viewport
        const viewport = page.getViewport({ scale });

        // Set canvas size to match the viewport
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render the page onto the canvas
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
        };
        await page.render(renderContext);
    } catch (error) {
        currentPage.value = 0
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

loadPDF();

// updating ui
watch(
    () => props.pdfUrl,
    () => {
        loadPDF();
        errorMessage.value = "";
        currentPage.value = 0; // Store the current page number
        totalPages.value = 0; // Store the total number of pages
    }
);
</script>