<script setup>
import { ref, onMounted, watch, onUnmounted } from "vue";
import { PageFlip } from "page-flip";
import { convertPdfToImages } from "~/utilities/convertPdfToImages";

const pages = ref([]);
const book = ref(null);
const currentPage = ref(''); 
const currentPageIndex = ref(0);
const totalPages = ref(0);
const autoPlay = ref(false);
let pageFlip = null;
let autoPlayInterval = null;
const orientation = ref('landscape');
const isFullScreen = ref(false);

// Function to load PDF images
const loadPages = async () => {
    try {
        pages.value = await convertPdfToImages("/pdf/science_for_kids.pdf");
        totalPages.value = pages.value.length;
    } catch (error) {
        console.error("Error while initializing PageFlip:", error);
    }
};

// Wait for pages to load
await loadPages();

// Initialize PageFlip
onMounted(() => {
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

        pageFlip.loadFromImages(pages.value);

        pageFlip.on("flip", (e) => {
            orientation.value = e.object?.render?.orientation;
            currentPageIndex.value = e.data;
            updateCurrentPage();
        });

        pageFlip.on("changeState", (e) => {
            orientation.value = e.object?.render?.orientation;
            currentPageIndex.value = e.data;
            updateCurrentPage();
        });

        document.addEventListener("keydown", handleKeyPress);
    } catch (error) {
        console.error("Error initializing PageFlip:", error);
    }
});

onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyPress);
    clearInterval(autoPlayInterval);
});

// Update current page display
const updateCurrentPage = () => {
    if (currentPageIndex.value >= 1) {
        currentPage.value = orientation.value === "landscape" ? `${currentPageIndex.value}-${currentPageIndex.value + 1}` : `${currentPageIndex.value}`;
    } else {
        currentPage.value = "cover";
    }
};

// Function to go to the previous page
const previousPage = () => {
    if (pageFlip) {
        stopAutoPlay();
        pageFlip.flipPrev();
    }
};

// Function to go to the next page
const nextPage = () => {
    if (pageFlip) {
        stopAutoPlay();
        pageFlip.flipNext();
    }
};

// Handle AutoPlay
const toggleAutoPlay = () => {
    autoPlay.value = !autoPlay.value;
    if (autoPlay.value) {
        autoPlayInterval = setInterval(() => {
            if (currentPageIndex.value < totalPages.value - 1) {
                pageFlip.flipNext();
                currentPageIndex.value++;
            } else {
                stopAutoPlay();
                currentPageIndex.value = 0;
            }
        }, 2000);
    } else {
        stopAutoPlay();
    }
};

const stopAutoPlay = () => {
    autoPlay.value = false;
    clearInterval(autoPlayInterval);
};

// Handle Keyboard Shortcuts
const handleKeyPress = (event) => {
    if (event.key === "ArrowRight") {
        nextPage();
    } else if (event.key === "ArrowLeft") {
        previousPage();
    } else if (event.key === "f") {
        toggleFullScreen();
    }
};

// Toggle Fullscreen
const toggleFullScreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
        elem.requestFullscreen().then(() => {
            isFullScreen.value = true;
        });
    } else {
        document.exitFullscreen().then(() => {
            isFullScreen.value = false;
        });
    }
};
</script>

<template>
    <section v-if="pages.length > 0" class="flipbook-container">
        <div ref="book" class="flipbook"></div>

        <!-- Controls -->
        <div class="controls">
            <button @click="previousPage" :disabled="currentPageIndex <= 0">Previous</button>
            <span>Page {{ currentPage }} of {{ totalPages }}</span>
            <button @click="nextPage">Next</button>
            <button @click="toggleAutoPlay">{{ autoPlay ? "Stop AutoPlay" : "Start AutoPlay" }}</button>
            <button @click="toggleFullScreen">{{ isFullScreen ? "Exit Fullscreen" : "Fullscreen" }}</button>
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

.flipbook {
    width: 600px;
    height: 800px;
    border: 2px solid #ccc;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease-in-out;
}

.controls {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

button {
    padding: 10px 15px;
    background-color: #56ade8;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 14px;
    border-radius: 5px;
    transition: background-color 0.2s, transform 0.2s;
}

button:hover {
    background-color: #428acb;
    transform: scale(1.05);
}

button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

span {
    font-size: 16px;
    font-weight: bold;
}
</style>
