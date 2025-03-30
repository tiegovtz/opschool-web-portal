<script setup>
import { ref, onMounted, watch } from "vue";
import { PageFlip } from "page-flip";
import { convertPdfToImages } from "~/utilities/convertPdfToImages";

const pages = ref([]);
const book = ref(null);
const currentPage = ref(''); // Initialize at 1 for the first page
const currentPageIndex = ref(0)
const totalPages = ref(0); // Total pages
const autoPlay = ref(false); // Auto-play state
let pageFlip = null; // PageFlip instance reference
const orientation = ref('landscape')

// Function to load PDF images
const loadPages = async () => {
    try {
        // Convert PDF to images and load them into the flipbook
        pages.value = await convertPdfToImages("/pdf/science_for_kids.pdf");
        totalPages.value = pages.value.length; // Set to first page if multiple pages
    } catch (error) {
        console.error("Error while initializing PageFlip:", error);
    }
};

// Wait for pages to be loaded before initializing PageFlip
await loadPages()

// Initialize the flipbook and load images after the pages are loaded
onMounted(async () => {
    try {
        pageFlip = new PageFlip(book.value, {
            width: 600,
            height: 800,
            size: "stretch",
            minWidth: 315,
            maxWidth: 1000,
            minHeight: 420,
            maxHeight: 1350,
            maxShadowOpacity: 0.5,
            showCover: true,
            mobileScrollSupport: true,
        });

        // Load images into the flipbook
        pageFlip.loadFromImages(pages.value);

        // triggered by page turning
        pageFlip.on('flip', (e) => {
            orientation.value = e.object?.render?.orientation;
            console.log('orientation: ', orientation.value, 'changeState flipping: ', e)
            currentPageIndex.value = e.data
            if (e.data > 1) {
                if (orientation.value == 'landscape') {
                    currentPage.value = `${e.data}-${e.data + 1}`;
                }
                else {
                    currentPage.value = `${e.data}`
                }
            }
        })

        // triggered when the state of the book changes
        pageFlip.on("changeState", (e) => {
            orientation.value = e.object?.render?.orientation;
            console.log('orientation: ', orientation.value, 'changeState: ', e)
            currentPageIndex.value = e.data
            if (e.data > 1) {
                if (orientation.value == 'landscape') {
                    currentPage.value = `${e.data}-${e.data + 1}`;
                }
                else {
                    currentPage.value = `${e.data}`
                }
            }
        });

    } catch (error) {
        console.error("Error initializing PageFlip:", error);
    }
});

// Function to go to the previous page
const previousPage = () => {
    if (pageFlip) {
        pageFlip.flipPrev();
    }
};

// Function to go to the next page
const nextPage = () => {
    if (pageFlip) {
        autoPlay.value ? clearInterval(): ''
        pageFlip.flipNext();
    }
};

// Function to toggle auto-play
const toggleAutoPlay = () => {
    autoPlay.value = !autoPlay.value;
    startAutoPlay();
};

// Start auto-play (page flips automatically every 2 seconds)
const startAutoPlay = () => {
    if (autoPlay) {
        setInterval(() => {
        if (currentPageIndex.value < totalPages.value) {
            pageFlip.flipNext()
            currentPageIndex.value++
        } else {
            clearInterval();
            currentPageIndex.value = 0
        }
    }, 1000); // Adjust the interval time as needed (2000ms = 2 seconds) 
    } else {
        // Stop auto-play
        clearInterval();
    }
};



</script>

<template>
    <section v-if="pages.length > 0" class="flipbook-container">
        <div ref="book" class="w-[600px] h-dvh"></div>
        <div class="controls">
            <button @click="previousPage" :disabled="currentPage == '' || currentPage == 'cover'">Previous</button>
            <span>Page {{ currentPage }} of {{ totalPages }}</span>
            <button @click="nextPage">Next</button>
            <button @click="toggleAutoPlay">{{ autoPlay ? 'Stop AutoPlay' : 'Start AutoPlay' }}</button>
        </div>
    </section>
    <LoadingIndicator v-else />
</template>

<style scoped>
.flipbook-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f8f8f8;
    flex-direction: column;
}

.controls {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

button {
    padding: 10px;
    background-color: #56ade8;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 14px;
    border-radius: 5px;
}

button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

span {
    font-size: 16px;
}
</style>
