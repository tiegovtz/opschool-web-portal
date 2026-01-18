<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// Make this page public (no auth required)
definePageMeta({
  middleware: []
});

interface ImageItem {
  path: string;
  alt: string;
  shortcode: string;
  category: string;
  description?: string;
  chapterName?: string;
  topicName?: string;
  subjectName?: string;
  subjectId?: string;
}

const images = ref<ImageItem[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const selectedCategory = ref<string>('all');
const searchKeyword = ref('');
const subjectIdFilter = ref<string>(''); // Filter by subject ID (e.g., '665865487b076d51f6fc037a' for Physics)
const stats = ref({
  total: 0,
  byCategory: {
    biology: 0,
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    geography: 0,
    horticulture: 0,
    english: 0,
    'leather-goods': 0,
  }
});

// Embedding generation state
const isGeneratingEmbeddings = ref(false);
const embeddingProgress = ref<string>('');
const embeddingError = ref<string | null>(null);
const embeddingSuccess = ref<string | null>(null);

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'biology', label: 'Biology' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'geography', label: 'Geography' },
  { value: 'horticulture', label: 'Horticulture' },
  { value: 'english', label: 'English' },
  { value: 'leather-goods', label: 'Leather Goods' },
];

const fetchImages = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    if (selectedCategory.value !== 'all') {
      params.append('category', selectedCategory.value);
    }
    if (subjectIdFilter.value.trim()) {
      params.append('subjectId', subjectIdFilter.value.trim());
    }
    if (searchKeyword.value.trim()) {
      params.append('keyword', searchKeyword.value.trim());
    }

    const url = `/api/image-list${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await $fetch<{
      success: boolean;
      total: number;
      filtered: number;
      byCategory: {
        biology: number;
        physics: number;
        chemistry: number;
        mathematics: number;
        geography: number;
        horticulture: number;
        english: number;
        'leather-goods': number;
      };
      images: ImageItem[];
    }>(url);

    if (response.success) {
      images.value = response.images;
      stats.value = {
        total: response.total,
        byCategory: response.byCategory,
      };
      console.log(`[image-list page] Loaded ${response.total} total images, ${response.filtered} filtered`);
    } else {
      throw new Error('Failed to fetch images');
    }
  } catch (err: any) {
    console.error('Error fetching images:', err);
    console.error('Error details:', {
      message: err.message,
      status: err.statusCode,
      statusMessage: err.statusMessage,
      data: err.data,
      response: err.response
    });
    
    // Extract the most descriptive error message
    const errorMessage = err.data?.message || 
                        err.message || 
                        err.statusMessage || 
                        `Failed to load images (Status: ${err.statusCode || 'Unknown'})`;
    
    error.value = errorMessage;
  } finally {
    isLoading.value = false;
  }
};

const filteredImages = computed(() => {
  return images.value;
});

const handleSearch = () => {
  fetchImages();
};

const handleCategoryChange = () => {
  fetchImages();
};

const copyShortcode = async (shortcode: string) => {
  try {
    await navigator.clipboard.writeText(`[image:${shortcode}]`);
    // Could add a toast notification here
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const generateEmbeddings = async () => {
  if (isGeneratingEmbeddings.value) return;
  
  isGeneratingEmbeddings.value = true;
  embeddingError.value = null;
  embeddingSuccess.value = null;
  embeddingProgress.value = 'Starting embedding generation...';

  try {
    const response = await $fetch<{
      success: boolean;
      total?: number;
      generated?: number;
      errors?: number;
      errorMessages?: string[];
      message?: string;
      error?: string;
    }>('/api/generate-embeddings');

    if (response.success) {
      embeddingSuccess.value = response.message || `Successfully generated ${response.generated} embeddings`;
      embeddingProgress.value = `Completed: ${response.generated}/${response.total} embeddings generated`;
      
      // Refresh images to show updated data
      setTimeout(() => {
        fetchImages();
      }, 1000);
    } else {
      embeddingError.value = response.error || 'Failed to generate embeddings';
      embeddingProgress.value = '';
    }
  } catch (err: any) {
    console.error('Error generating embeddings:', err);
    embeddingError.value = err.message || err.data?.error || 'Failed to generate embeddings';
    embeddingProgress.value = '';
  } finally {
    isGeneratingEmbeddings.value = false;
  }
};

onMounted(() => {
  fetchImages();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Simple Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <NuxtLink to="/" class="text-oceanBlue hover:text-deepBlue">← Back to Home</NuxtLink>
      </div>
    </header>

    <div class="py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">Chapter Images Library</h1>
              <p class="text-gray-600">
                Browse all images extracted from lesson chapters. Use the shortcode format <code class="bg-gray-200 px-2 py-1 rounded">[image:shortcode]</code> to reference images in AI responses.
              </p>
            </div>
            <button
              @click="generateEmbeddings"
              :disabled="isGeneratingEmbeddings"
              class="px-4 py-2 bg-oceanBlue text-white rounded-lg hover:bg-deepBlue disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <span v-if="isGeneratingEmbeddings">Generating...</span>
              <span v-else>Generate Embeddings</span>
            </button>
          </div>
          
          <!-- Embedding Status -->
          <div v-if="embeddingProgress || embeddingError || embeddingSuccess" class="mb-4">
            <div v-if="embeddingProgress" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
              <p class="text-sm text-blue-800">{{ embeddingProgress }}</p>
            </div>
            <div v-if="embeddingSuccess" class="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
              <p class="text-sm text-green-800">{{ embeddingSuccess }}</p>
            </div>
            <div v-if="embeddingError" class="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
              <p class="text-sm text-red-800">{{ embeddingError }}</p>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-2xl font-bold text-gray-900">{{ stats.total }}</div>
            <div class="text-sm text-gray-600">Total Images</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-2xl font-bold text-blue-600">{{ stats.byCategory.biology }}</div>
            <div class="text-sm text-gray-600">Biology</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-2xl font-bold text-purple-600">{{ stats.byCategory.physics }}</div>
            <div class="text-sm text-gray-600">Physics</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-2xl font-bold text-green-600">{{ stats.byCategory.chemistry }}</div>
            <div class="text-sm text-gray-600">Chemistry</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-2xl font-bold text-orange-600">{{ stats.byCategory.mathematics }}</div>
            <div class="text-sm text-gray-600">Mathematics</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-2xl font-bold text-teal-600">{{ stats.byCategory.geography }}</div>
            <div class="text-sm text-gray-600">Geography</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-2xl font-bold text-emerald-600">{{ stats.byCategory.horticulture }}</div>
            <div class="text-sm text-gray-600">Horticulture</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-2xl font-bold text-indigo-600">{{ stats.byCategory.english }}</div>
            <div class="text-sm text-gray-600">English</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-2xl font-bold text-amber-600">{{ stats.byCategory['leather-goods'] }}</div>
            <div class="text-sm text-gray-600">Leather Goods</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Category Filter -->
            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                v-model="selectedCategory"
                @change="handleCategoryChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue"
              >
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                  {{ cat.label }}
                </option>
              </select>
            </div>

            <!-- Subject ID Filter -->
            <div>
              <label for="subjectId" class="block text-sm font-medium text-gray-700 mb-2">
                Subject ID Filter
              </label>
              <input
                id="subjectId"
                v-model="subjectIdFilter"
                type="text"
                placeholder="e.g., 665865487b076d51f6fc037a"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm"
                @keyup.enter="fetchImages"
              />
              <p class="text-xs text-gray-500 mt-1">Leave empty to show all subjects</p>
            </div>

            <!-- Search -->
            <div>
              <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
                Search by keyword
              </label>
              <div class="flex gap-2">
                <input
                  id="search"
                  v-model="searchKeyword"
                  type="text"
                  placeholder="e.g., cell, wave, circuit..."
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue"
                  @keyup.enter="handleSearch"
                />
                <button
                  @click="handleSearch"
                  class="px-4 py-2 bg-oceanBlue text-white rounded-md hover:bg-deepBlue transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-oceanBlue"></div>
          <p class="mt-4 text-gray-600">Loading images...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p class="text-red-800 font-medium">Error loading images</p>
          <p class="text-red-600 mt-2">{{ error }}</p>
          <button
            @click="fetchImages"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>

        <!-- Images Grid -->
        <div v-else-if="filteredImages.length > 0" class="mb-6">
          <div class="mb-4 text-gray-600">
            Showing <strong>{{ filteredImages.length }}</strong> image{{ filteredImages.length === 1 ? '' : 's' }}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div
              v-for="(image, index) in filteredImages"
              :key="index"
              class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <!-- Image -->
              <div class="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                <NuxtImg
                  :src="image.path"
                  :alt="image.alt"
                  class="w-full h-full object-contain"
                  loading="lazy"
                  @error="(e: any) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }"
                />
                <div class="hidden items-center justify-center text-gray-400 text-sm p-4">
                  Image not available
                </div>
              </div>

              <!-- Info -->
              <div class="p-4">
                <div class="mb-2">
                  <span
                    class="inline-block px-2 py-1 text-xs font-semibold rounded"
                    :class="{
                      'bg-blue-100 text-blue-800': image.category === 'biology',
                      'bg-purple-100 text-purple-800': image.category === 'physics',
                      'bg-green-100 text-green-800': image.category === 'chemistry',
                      'bg-orange-100 text-orange-800': image.category === 'mathematics',
                      'bg-teal-100 text-teal-800': image.category === 'geography',
                      'bg-emerald-100 text-emerald-800': image.category === 'horticulture',
                      'bg-indigo-100 text-indigo-800': image.category === 'english',
                      'bg-amber-100 text-amber-800': image.category === 'leather-goods',
                    }"
                  >
                    {{ image.category }}
                  </span>
                </div>
                <p class="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                  {{ image.alt }}
                </p>
                <div v-if="image.description" class="text-xs text-gray-600 mt-2 mb-2 line-clamp-3 border-l-2 border-gray-200 pl-2">
                  <span class="font-medium text-gray-700">Description:</span> {{ image.description }}
                </div>
                <div class="mt-2 space-y-1">
                  <div class="text-xs text-gray-500">
                    <span class="font-medium">Shortcode:</span>
                    <code class="bg-gray-100 px-1 py-0.5 rounded text-xs ml-1">{{ image.shortcode }}</code>
                  </div>
                  <div v-if="image.subjectName" class="text-xs text-gray-500">
                    <span class="font-medium">Subject:</span> {{ image.subjectName }}
                  </div>
                  <div v-if="image.topicName" class="text-xs text-gray-500">
                    <span class="font-medium">Topic:</span> {{ image.topicName }}
                  </div>
                  <div v-if="image.chapterName" class="text-xs text-gray-500">
                    <span class="font-medium">Chapter:</span> {{ image.chapterName }}
                  </div>
                </div>
                <button
                  @click="copyShortcode(image.shortcode)"
                  class="mt-3 w-full px-3 py-1.5 text-xs bg-oceanBlue text-white rounded hover:bg-deepBlue transition-colors"
                >
                  Copy Shortcode
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="bg-white rounded-lg shadow p-12 text-center">
          <p class="text-gray-600 text-lg">No images found</p>
          <p class="text-gray-500 mt-2">Try adjusting your filters or search term</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

