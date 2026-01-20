<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

// Make this page public (no auth required)
definePageMeta({
  middleware: []
});

interface ImageItem {
  path?: string;
  paths?: string[];  // For multi-image parent entries
  alt: string;
  shortcode: string;
  category: string;
  description?: string;
  chapterName?: string;
  topicName?: string;
  subjectName?: string;
  subjectId?: string;
  isPartOfMultiImage?: boolean;
  parentShortcode?: string;
  imageIndex?: number;
}

interface SyllabusChapter {
  number: number;
  title: string;
  fullTitle: string;
  topics: string[];
}

interface SyllabusSubject {
  id: string;
  name: string;
  level: string;
  chapters: SyllabusChapter[];
}

const images = ref<ImageItem[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const selectedCategory = ref<string>('all');
const searchKeyword = ref('');
const subjectIdFilter = ref<string>(''); // Filter by subject ID (e.g., '665865487b076d51f6fc037a' for Physics)

// Add Image Form State
const isAddFormOpen = ref(false);
const isAddingImage = ref(false);
const addFormError = ref<string | null>(null);
const addFormSuccess = ref<string | null>(null);

// Edit Image Modal State
const isEditModalOpen = ref(false);
const isUpdatingImage = ref(false);
const editFormError = ref<string | null>(null);
const editFormSuccess = ref<string | null>(null);
const editingImage = ref<ImageItem | null>(null);
const editingShortcode = ref('');
const editIsMultiImage = ref(false);
const editFormUrl = ref('');
const editFormUrls = ref<string[]>(['']);
const editFormAlt = ref('');
const editFormAlts = ref<string[]>(['']);
const editFormDescription = ref('');
const editFormCategory = ref('biology');

// Syllabus data for cascading dropdowns
const syllabusData = ref<SyllabusSubject[]>([]);
const isSyllabusLoading = ref(false);

// Form fields
const formImageType = ref<'single' | 'multi'>('single');
const formUrl = ref('');
const formUrls = ref<string[]>(['']);
const formAlt = ref('');
const formAlts = ref<string[]>(['']);
const formCategory = ref('biology');
const formDescription = ref('');
const formFigureNumber = ref('');
const formSelectedSubject = ref('');
const formSelectedChapter = ref('');
const formSelectedTopic = ref('');

// Computed: chapters for selected subject
const availableChapters = computed(() => {
  const subject = syllabusData.value.find(s => s.id === formSelectedSubject.value);
  return subject?.chapters || [];
});

// Computed: topics for selected chapter
const availableTopics = computed(() => {
  const chapter = availableChapters.value.find(c => c.fullTitle === formSelectedChapter.value);
  return chapter?.topics || [];
});

// Computed: shortcode preview based on selected subject and figure number
const shortcodePreview = computed(() => {
  const selectedSubjectData = syllabusData.value.find(s => s.id === formSelectedSubject.value);
  const nameParts = selectedSubjectData?.name?.toLowerCase().split(' ') || [];
  
  // Extract subject (e.g., "Biology Form 1" -> "biology")
  const subject = nameParts[0]?.replace(/[^a-z]/g, '') || 'subject';
  
  // Extract level (e.g., "Form 1" -> "form1")
  const formIndex = nameParts.findIndex(p => p === 'form');
  let level = '';
  if (formIndex !== -1 && nameParts[formIndex + 1]) {
    level = `form${nameParts[formIndex + 1].replace(/[^0-9]/g, '')}`;
  }
  
  const figureNum = formFigureNumber.value?.replace(/\./g, '_') || 'X_X';
  const prefix = level ? `${subject}_${level}` : subject;
  return `${prefix}_figure_${figureNum}`;
});

// Watch subject changes to reset chapter/topic AND auto-set category
watch(formSelectedSubject, () => {
  formSelectedChapter.value = '';
  formSelectedTopic.value = '';
  
  // Auto-set category based on subject name
  const selectedSubjectData = syllabusData.value.find(s => s.id === formSelectedSubject.value);
  if (selectedSubjectData) {
    const subjectName = selectedSubjectData.name.toLowerCase().split(' ')[0];
    // Map subject names to category values
    const categoryMap: Record<string, string> = {
      'biology': 'biology',
      'physics': 'physics',
      'chemistry': 'chemistry',
      'mathematics': 'mathematics',
      'math': 'mathematics',
      'maths': 'mathematics',
      'geography': 'geography',
      'horticulture': 'horticulture',
      'english': 'english',
      'leather': 'leather-goods',
    };
    formCategory.value = categoryMap[subjectName] || 'biology';
  }
});

// Watch chapter changes to reset topic
watch(formSelectedChapter, () => {
  formSelectedTopic.value = '';
});

// Load syllabus data
const loadSyllabusData = async () => {
  if (syllabusData.value.length > 0) return; // Already loaded
  
  isSyllabusLoading.value = true;
  try {
    const response = await $fetch<{ success: boolean; subjects: SyllabusSubject[] }>('/api/syllabus-list');
    if (response.success) {
      syllabusData.value = response.subjects;
    }
  } catch (err) {
    console.error('Error loading syllabus:', err);
  } finally {
    isSyllabusLoading.value = false;
  }
};

// Toggle add form
const handleToggleAddForm = () => {
  isAddFormOpen.value = !isAddFormOpen.value;
  if (isAddFormOpen.value) {
    loadSyllabusData();
  }
};

// Add URL field for multi-image
const handleAddUrlField = () => {
  formUrls.value.push('');
  formAlts.value.push('');
};

// Remove URL field for multi-image
const handleRemoveUrlField = (index: number) => {
  if (formUrls.value.length > 1) {
    formUrls.value.splice(index, 1);
    formAlts.value.splice(index, 1);
  }
};

// Reset form
const resetAddForm = () => {
  formImageType.value = 'single';
  formUrl.value = '';
  formUrls.value = [''];
  formAlt.value = '';
  formAlts.value = [''];
  formCategory.value = 'biology';
  formDescription.value = '';
  formFigureNumber.value = '';
  formSelectedSubject.value = '';
  formSelectedChapter.value = '';
  formSelectedTopic.value = '';
  addFormError.value = null;
};

// Submit new image
const handleSubmitImage = async () => {
  if (isAddingImage.value) return;

  addFormError.value = null;
  addFormSuccess.value = null;

  // Validation
  if (!formSelectedSubject.value) {
    addFormError.value = 'Subject is required for generating the shortcode';
    return;
  }

  if (!formFigureNumber.value.trim()) {
    addFormError.value = 'Figure number is required';
    return;
  }

  if (formImageType.value === 'single') {
    if (!formUrl.value.trim()) {
      addFormError.value = 'Image URL is required';
      return;
    }
    if (!formAlt.value.trim()) {
      addFormError.value = 'Alt text is required';
      return;
    }
  } else {
    const validUrls = formUrls.value.filter(u => u.trim());
    if (validUrls.length === 0) {
      addFormError.value = 'At least one image URL is required';
      return;
    }
  }

  isAddingImage.value = true;

  try {
    // Get subject name from selected subject
    const selectedSubjectData = syllabusData.value.find(s => s.id === formSelectedSubject.value);
    const subjectName = selectedSubjectData?.name.split(' ')[0] || ''; // e.g., "Biology" from "Biology Form 1"

    const payload = formImageType.value === 'single'
      ? {
          type: 'single' as const,
          path: formUrl.value.trim(),
          alt: formAlt.value.trim(),
          category: formCategory.value,
          description: formDescription.value.trim(),
          chapterName: formSelectedChapter.value,
          topicName: formSelectedTopic.value,
          subjectName,
          figureNumber: formFigureNumber.value.trim(),
        }
      : {
          type: 'multi' as const,
          paths: formUrls.value.filter(u => u.trim()),
          alts: formAlts.value.filter((_, i) => formUrls.value[i]?.trim()),
          alt: formAlts.value.filter((_, i) => formUrls.value[i]?.trim()).join(' '),
          category: formCategory.value,
          description: formDescription.value.trim(),
          chapterName: formSelectedChapter.value,
          topicName: formSelectedTopic.value,
          subjectName,
          figureNumber: formFigureNumber.value.trim(),
        };

    const response = await $fetch<{ success: boolean; message: string; shortcode: string }>('/api/image-shortcode-add', {
      method: 'POST',
      body: payload,
    });

    if (response.success) {
      addFormSuccess.value = response.message;
      resetAddForm();
      // Refresh images list
      setTimeout(() => {
        fetchImages();
        addFormSuccess.value = null;
      }, 2000);
    }
  } catch (err: any) {
    console.error('Error adding image:', err);
    addFormError.value = err.data?.message || err.message || 'Failed to add image';
  } finally {
    isAddingImage.value = false;
  }
};
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

    // Add cache-busting timestamp to ensure fresh data
    params.append('_t', Date.now().toString());
    const url = `/api/image-list?${params.toString()}`;
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
      
      // Debug: Log the actual URLs being displayed
      const testImage = response.images.find((img: ImageItem) => img.shortcode === 'biology_form1_figure_1_5');
      if (testImage) {
        console.log(`[image-list page] 🔍 DEBUG: biology_form1_figure_1_5 URL:`, testImage.path);
        console.log(`[image-list page] 🔍 DEBUG: Response timestamp:`, (response as any).responseTimestamp);
        console.log(`[image-list page] 🔍 DEBUG: File modified at:`, (response as any).fileModifiedAt);
      }
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
  // Filter out parent shortcode entries (those with paths but no path)
  // These are used for AI resolution but shouldn't be displayed in the image grid
  return images.value.filter(img => img.path && !img.paths);
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

// Edit image functions
const handleOpenEditModal = async (image: ImageItem) => {
  // For sub-images (parts of multi-image), use the parent shortcode
  const shortcodeToEdit = image.parentShortcode || image.shortcode;
  editingShortcode.value = shortcodeToEdit;
  
  editingImage.value = image;
  editFormDescription.value = image.description || '';
  editFormCategory.value = image.category || 'biology';
  editFormError.value = null;
  editFormSuccess.value = null;

  // Check if this is part of a multi-image figure
  if (image.isPartOfMultiImage && image.parentShortcode) {
    editIsMultiImage.value = true;
    
    // Find all sibling images with the same parent shortcode
    const siblingImages = images.value.filter(
      img => img.parentShortcode === image.parentShortcode && img.path
    ).sort((a, b) => (a.imageIndex || 0) - (b.imageIndex || 0));
    
    if (siblingImages.length > 0) {
      editFormUrls.value = siblingImages.map(img => img.path || '');
      editFormAlts.value = siblingImages.map(img => img.alt || '');
      // Use first image's description as main alt
      editFormAlt.value = image.alt || siblingImages.map(img => img.alt).join(' ');
    } else {
      editFormUrls.value = [image.path || ''];
      editFormAlts.value = [image.alt || ''];
      editFormAlt.value = image.alt || '';
    }
  } else {
    // Single image
    editIsMultiImage.value = false;
    editFormUrl.value = image.path || '';
    editFormAlt.value = image.alt || '';
    editFormUrls.value = [''];
    editFormAlts.value = [''];
  }

  isEditModalOpen.value = true;
};

const handleCloseEditModal = () => {
  isEditModalOpen.value = false;
  editingImage.value = null;
  editingShortcode.value = '';
  editIsMultiImage.value = false;
  editFormUrl.value = '';
  editFormUrls.value = [''];
  editFormAlt.value = '';
  editFormAlts.value = [''];
  editFormDescription.value = '';
  editFormCategory.value = 'biology';
  editFormError.value = null;
  editFormSuccess.value = null;
};

// Add/remove URL fields for multi-image edit
const handleAddEditUrlField = () => {
  editFormUrls.value.push('');
  editFormAlts.value.push('');
};

const handleRemoveEditUrlField = (index: number) => {
  if (editFormUrls.value.length > 1) {
    editFormUrls.value.splice(index, 1);
    editFormAlts.value.splice(index, 1);
  }
};

const handleSubmitEdit = async () => {
  if (isUpdatingImage.value || !editingShortcode.value) return;

  editFormError.value = null;
  editFormSuccess.value = null;

  // Validation
  if (editIsMultiImage.value) {
    const validUrls = editFormUrls.value.filter(u => u.trim());
    if (validUrls.length === 0) {
      editFormError.value = 'At least one image URL is required';
      return;
    }
  } else {
    if (!editFormUrl.value.trim()) {
      editFormError.value = 'Image URL is required';
      return;
    }
  }

  isUpdatingImage.value = true;

  try {
    const payload: Record<string, any> = {
      shortcode: editingShortcode.value,
      description: editFormDescription.value.trim(),
      category: editFormCategory.value,
    };

    if (editIsMultiImage.value) {
      // Multi-image: send paths and alts arrays
      const validUrls = editFormUrls.value.filter(u => u.trim());
      const validAlts = editFormAlts.value.filter((_, i) => editFormUrls.value[i]?.trim());
      payload.paths = validUrls;
      payload.alts = validAlts;
      payload.alt = validAlts.join(' '); // Combined alt text
    } else {
      // Single image
      payload.path = editFormUrl.value.trim();
      payload.alt = editFormAlt.value.trim();
    }

    const response = await $fetch<{ success: boolean; message: string }>('/api/image-shortcode-update', {
      method: 'POST',
      body: payload,
    });

    if (response.success) {
      editFormSuccess.value = response.message;
      // Refresh images list after a short delay
      setTimeout(() => {
        fetchImages();
        handleCloseEditModal();
      }, 1500);
    }
  } catch (err: any) {
    console.error('Error updating image:', err);
    editFormError.value = err.data?.message || err.message || 'Failed to update image';
  } finally {
    isUpdatingImage.value = false;
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

        <!-- Add New Image Section -->
        <div class="bg-white rounded-lg shadow mb-6">
          <!-- Collapsible Header -->
          <button
            @click="handleToggleAddForm"
            class="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-lg"
            aria-expanded="isAddFormOpen"
            aria-controls="add-image-form"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">➕</span>
              <span class="text-lg font-semibold text-gray-900">Add New Image</span>
            </div>
            <span class="text-gray-500 transform transition-transform" :class="{ 'rotate-180': isAddFormOpen }">
              ▼
            </span>
          </button>

          <!-- Collapsible Form -->
          <div
            v-show="isAddFormOpen"
            id="add-image-form"
            class="px-6 pb-6 border-t border-gray-100"
          >
            <!-- Success/Error Messages -->
            <div v-if="addFormSuccess" class="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p class="text-sm text-green-800">{{ addFormSuccess }}</p>
            </div>
            <div v-if="addFormError" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm text-red-800">{{ addFormError }}</p>
            </div>

            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Left Column -->
              <div class="space-y-4">
                <!-- Image Type Toggle -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Image Type</label>
                  <div class="flex gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        v-model="formImageType"
                        value="single"
                        class="text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span class="text-sm text-gray-700">Single Image</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        v-model="formImageType"
                        value="multi"
                        class="text-oceanBlue focus:ring-oceanBlue"
                      />
                      <span class="text-sm text-gray-700">Multi-Image Figure</span>
                    </label>
                  </div>
                </div>

                <!-- Single Image URL -->
                <div v-if="formImageType === 'single'">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    v-model="formUrl"
                    type="url"
                    placeholder="https://opschool.tie.go.tz:5001/uploads/..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm"
                  />
                  <!-- Thumbnail preview -->
                  <div v-if="formUrl" class="mt-2 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      :src="formUrl" 
                      alt="Preview" 
                      class="w-full h-full object-contain"
                      @error="($event.target as HTMLImageElement).style.display = 'none'"
                    />
                  </div>
                </div>

                <!-- Multi-Image URLs -->
                <div v-else>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Image URLs</label>
                  <div class="space-y-3">
                    <div v-for="(_, index) in formUrls" :key="index" class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div class="flex gap-2">
                        <div class="flex-1 space-y-2">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="text-xs font-semibold text-gray-600 bg-gray-200 px-2 py-0.5 rounded">Image {{ index + 1 }}</span>
                          </div>
                          <input
                            v-model="formUrls[index]"
                            type="url"
                            :placeholder="`URL: https://opschool.tie.go.tz:5001/uploads/...`"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm"
                          />
                          <input
                            v-model="formAlts[index]"
                            type="text"
                            :placeholder="`Alt text: (${String.fromCharCode(97 + index)}) description...`"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm"
                          />
                          <!-- Thumbnail preview -->
                          <div v-if="formUrls[index]" class="h-20 bg-gray-100 rounded overflow-hidden border border-gray-200">
                            <img 
                              :src="formUrls[index]" 
                              :alt="formAlts[index] || 'Preview'" 
                              class="w-full h-full object-contain"
                              @error="($event.target as HTMLImageElement).style.display = 'none'"
                            />
                          </div>
                        </div>
                        <button
                          v-if="formUrls.length > 1"
                          @click="handleRemoveUrlField(index)"
                          class="self-start px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove this image"
                          type="button"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <button
                      @click="handleAddUrlField"
                      class="text-sm text-oceanBlue hover:text-deepBlue font-medium"
                      type="button"
                    >
                      + Add another image
                    </button>
                  </div>
                </div>

                <!-- Alt Text (Single) -->
                <div v-if="formImageType === 'single'">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Alt Text</label>
                  <input
                    v-model="formAlt"
                    type="text"
                    placeholder="Descriptive alt text for the image"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm"
                  />
                </div>

                <!-- Figure Number -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Figure Number</label>
                  <input
                    v-model="formFigureNumber"
                    type="text"
                    placeholder="e.g., 1.6, 2.1, 3.4"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm"
                  />
                  <p class="text-xs text-gray-500 mt-1">Generates shortcode: {{ shortcodePreview }}</p>
                </div>
              </div>

              <!-- Right Column -->
              <div class="space-y-4">
                <!-- Subject Dropdown -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    v-model="formSelectedSubject"
                    :disabled="isSyllabusLoading"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm disabled:bg-gray-100"
                  >
                    <option value="">{{ isSyllabusLoading ? 'Loading...' : 'Select a subject' }}</option>
                    <option v-for="subject in syllabusData" :key="subject.id" :value="subject.id">
                      {{ subject.name }}
                    </option>
                  </select>
                </div>

                <!-- Chapter Dropdown -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
                  <select
                    v-model="formSelectedChapter"
                    :disabled="!formSelectedSubject"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm disabled:bg-gray-100"
                  >
                    <option value="">{{ formSelectedSubject ? 'Select a chapter' : 'Select a subject first' }}</option>
                    <option v-for="chapter in availableChapters" :key="chapter.number" :value="chapter.fullTitle">
                      {{ chapter.fullTitle }}
                    </option>
                  </select>
                </div>

                <!-- Topic Dropdown -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                  <select
                    v-model="formSelectedTopic"
                    :disabled="!formSelectedChapter"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm disabled:bg-gray-100"
                  >
                    <option value="">{{ formSelectedChapter ? 'Select a topic' : 'Select a chapter first' }}</option>
                    <option v-for="topic in availableTopics" :key="topic" :value="topic">
                      {{ topic }}
                    </option>
                  </select>
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <textarea
                    v-model="formDescription"
                    rows="3"
                    placeholder="Detailed description of the image content..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="mt-6 flex justify-end gap-3">
              <button
                @click="resetAddForm"
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                type="button"
              >
                Reset
              </button>
              <button
                @click="handleSubmitImage"
                :disabled="isAddingImage"
                class="px-6 py-2 bg-oceanBlue text-white rounded-md hover:bg-deepBlue disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                {{ isAddingImage ? 'Adding...' : 'Add Image' }}
              </button>
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
                <div class="mb-2 flex flex-wrap gap-1">
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
                  <span
                    v-if="image.isPartOfMultiImage"
                    class="inline-block px-2 py-1 text-xs font-semibold rounded bg-pink-100 text-pink-800"
                    :title="`Part of figure: ${image.parentShortcode}`"
                  >
                    Part {{ (image.imageIndex ?? 0) + 1 }}
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
                  <div v-if="image.isPartOfMultiImage && image.parentShortcode" class="text-xs text-gray-500">
                    <span class="font-medium">Figure:</span>
                    <code class="bg-pink-50 px-1 py-0.5 rounded text-xs ml-1 text-pink-700">{{ image.parentShortcode }}</code>
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
                <div class="mt-3 flex gap-2">
                  <button
                    @click="copyShortcode(image.shortcode)"
                    class="flex-1 px-3 py-1.5 text-xs bg-oceanBlue text-white rounded hover:bg-deepBlue transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    @click="handleOpenEditModal(image)"
                    class="flex-1 px-3 py-1.5 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                  >
                    Edit
                  </button>
                </div>
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

    <!-- Edit Image Modal -->
    <div
      v-if="isEditModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="handleCloseEditModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">Edit Image</h3>
          <button
            @click="handleCloseEditModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <span class="text-2xl">&times;</span>
          </button>
        </div>

        <div class="px-6 py-4 space-y-4">
          <!-- Multi-image indicator -->
          <div v-if="editIsMultiImage" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-blue-800 font-medium">📷 Editing Multi-Image Figure</p>
            <p class="text-xs text-blue-600 mt-1">This figure contains {{ editFormUrls.length }} images. Edit all images together below.</p>
          </div>

          <!-- Shortcode info -->
          <div class="text-xs text-gray-500">
            Shortcode: <code class="bg-gray-100 px-1 rounded font-mono">{{ editingShortcode }}</code>
          </div>

          <!-- Success/Error Messages -->
          <div v-if="editFormSuccess" class="bg-green-50 border border-green-200 rounded-lg p-3">
            <p class="text-sm text-green-800">{{ editFormSuccess }}</p>
          </div>
          <div v-if="editFormError" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-800">{{ editFormError }}</p>
          </div>

          <!-- Single Image URL -->
          <div v-if="!editIsMultiImage">
            <label class="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
            <input
              v-model="editFormUrl"
              type="url"
              placeholder="https://opschool.tie.go.tz:5001/uploads/..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm"
            />
            <!-- Preview -->
            <div v-if="editFormUrl" class="mt-2 aspect-video bg-gray-100 rounded-lg overflow-hidden max-h-32">
              <img :src="editFormUrl" alt="Preview" class="w-full h-full object-contain" />
            </div>
          </div>

          <!-- Multi-Image URLs -->
          <div v-else>
            <label class="block text-sm font-medium text-gray-700 mb-2">Image URLs</label>
            <div class="space-y-3">
              <div v-for="(_, index) in editFormUrls" :key="index" class="p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs font-semibold text-gray-600 bg-gray-200 px-2 py-0.5 rounded">Image {{ index + 1 }}</span>
                  <button
                    v-if="editFormUrls.length > 1"
                    @click="handleRemoveEditUrlField(index)"
                    class="text-xs text-red-600 hover:text-red-800"
                    type="button"
                  >
                    Remove
                  </button>
                </div>
                <input
                  v-model="editFormUrls[index]"
                  type="url"
                  :placeholder="`URL ${index + 1}: https://opschool.tie.go.tz:5001/uploads/...`"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm mb-2"
                />
                <input
                  v-model="editFormAlts[index]"
                  type="text"
                  :placeholder="`Alt text ${index + 1}: (a) description...`"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm"
                />
                <!-- Mini preview -->
                <div v-if="editFormUrls[index]" class="mt-2 h-16 bg-gray-100 rounded overflow-hidden">
                  <img :src="editFormUrls[index]" :alt="editFormAlts[index]" class="w-full h-full object-contain" />
                </div>
              </div>
              <button
                @click="handleAddEditUrlField"
                class="text-sm text-oceanBlue hover:text-deepBlue font-medium"
                type="button"
              >
                + Add another image
              </button>
            </div>
          </div>

          <!-- Alt Text (single image only) -->
          <div v-if="!editIsMultiImage">
            <label class="block text-sm font-medium text-gray-700 mb-2">Alt Text</label>
            <input
              v-model="editFormAlt"
              type="text"
              placeholder="Descriptive alt text for the image"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              v-model="editFormDescription"
              rows="3"
              placeholder="Detailed description of the image content..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-oceanBlue focus:border-oceanBlue text-sm resize-none"
            ></textarea>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            @click="handleCloseEditModal"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSubmitEdit"
            :disabled="isUpdatingImage"
            class="px-6 py-2 bg-oceanBlue text-white rounded-md hover:bg-deepBlue disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {{ isUpdatingImage ? 'Saving...' : 'Save Changes' }}
          </button>
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

