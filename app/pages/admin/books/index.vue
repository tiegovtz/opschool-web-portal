<template>
  <NuxtLayout name="home-layout">
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900">Book Management</h1>
          <p class="text-gray-600 mt-2">Upload and manage PDF textbooks for RAG (Retrieval-Augmented Generation)</p>
        </div>

        <!-- Upload Section -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">Upload PDF Book</h2>
          
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              ref="fileInput"
              type="file"
              accept=".pdf"
              @change="handleFileSelect"
              class="hidden"
            />
            
            <div v-if="!uploading && !selectedFile">
              <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="mt-4">
                <button
                  @click="() => { const input = $refs.fileInput as HTMLInputElement; input?.click(); }"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Select PDF File
                </button>
                <p class="mt-2 text-sm text-gray-600">or drag and drop a PDF file here</p>
              </div>
            </div>

            <div v-if="selectedFile && !uploading">
              <div class="flex items-center justify-center gap-4">
                <svg class="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <div class="text-left">
                  <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
                  <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
                <button
                  @click="clearSelection"
                  class="ml-4 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              <button
                @click="uploadFile"
                :disabled="uploading"
                class="mt-4 inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="!uploading">Upload and Process</span>
                <span v-else class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              </button>
            </div>

            <div v-if="uploading" class="mt-4">
              <div class="bg-gray-200 rounded-full h-2.5">
                <div class="bg-primary h-2.5 rounded-full transition-all duration-300" :style="{ width: uploadProgress + '%' }"></div>
              </div>
              <p class="mt-2 text-sm text-gray-600">{{ uploadStatus }}</p>
            </div>
          </div>

          <!-- Upload Result -->
          <div v-if="uploadResult" class="mt-4 p-4 rounded-lg" :class="uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
            <div class="flex items-start">
              <svg v-if="uploadResult.success" class="h-5 w-5 text-green-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <svg v-else class="h-5 w-5 text-red-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium" :class="uploadResult.success ? 'text-green-800' : 'text-red-800'">
                  {{ uploadResult.message }}
                </p>
                <div v-if="uploadResult.success && uploadResult.bookId" class="mt-2 text-sm text-gray-600">
                  <p>Book ID: {{ uploadResult.bookId }}</p>
                  <p>Chunks: {{ uploadResult.chunksCount }}</p>
                  <p>Total Tokens: {{ uploadResult.totalTokens?.toLocaleString() }}</p>
                </div>
                <div v-if="!uploadResult.success" class="mt-2">
                  <p class="text-xs text-red-600">Check the browser console and server terminal for detailed error logs.</p>
                </div>
              </div>
              <button @click="uploadResult = null" class="text-gray-400 hover:text-gray-600">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- RAG Search Section -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">Test RAG Search</h2>
          <p class="text-gray-600 mb-4">Search directly in the uploaded books to test RAG functionality</p>
          
          <div class="flex gap-4 mb-4">
            <div class="flex-1">
              <input
                v-model="searchQuery"
                @keyup.enter="performSearch"
                type="text"
                placeholder="Enter search query (e.g., 'what is physics?')"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div class="flex gap-2">
              <input
                v-model.number="searchThreshold"
                type="number"
                step="0.1"
                min="0"
                max="1"
                placeholder="Threshold"
                class="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
              <input
                v-model.number="searchLimit"
                type="number"
                min="1"
                max="20"
                placeholder="Limit"
                class="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
              <button
                @click="performSearch"
                :disabled="searching || !searchQuery.trim()"
                class="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg v-if="!searching" class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <svg v-else class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ searching ? 'Searching...' : 'Search' }}
              </button>
            </div>
          </div>

          <!-- Search Results -->
          <div v-if="searchResults" class="mt-6">
            <div class="mb-4 p-4 bg-blue-50 rounded-lg">
              <p class="text-sm text-gray-700">
                <span class="font-semibold">Query:</span> "{{ searchResults.query }}"
                <span class="ml-4 font-semibold">Results:</span> {{ searchResults.resultsCount }} / {{ searchResults.limit }}
                <span class="ml-4 font-semibold">Threshold:</span> {{ searchResults.threshold }}
              </p>
            </div>

            <div v-if="searchResults.resultsCount === 0" class="text-center py-8 bg-yellow-50 rounded-lg">
              <svg class="mx-auto h-12 w-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <p class="mt-2 text-gray-600">No results found above threshold {{ searchResults.threshold }}</p>
              <p class="text-sm text-gray-500">Try lowering the threshold or using a different query</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(result, index) in searchResults.results"
                :key="index"
                class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-1 bg-primary text-white text-xs font-semibold rounded">
                      Similarity: {{ (result.similarity * 100).toFixed(2) }}%
                    </span>
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {{ result.metadata.bookTitle }}
                    </span>
                    <span v-if="result.metadata.citation !== 'Unknown'" class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {{ result.metadata.citation }}
                    </span>
                  </div>
                </div>
                <div class="mt-2">
                  <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ result.content.substring(0, 500) }}{{ result.content.length > 500 ? '...' : '' }}</p>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                  Chunk #{{ result.metadata.chunkIndex }} | ~{{ result.metadata.tokenEstimate }} tokens
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Books List -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-semibold text-gray-900">Uploaded Books</h2>
            <button
              @click="loadBooks"
              :disabled="loading"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              <svg class="h-4 w-4 mr-2" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh
            </button>
          </div>

          <!-- Stats -->
          <div v-if="stats" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-blue-50 rounded-lg p-4">
              <p class="text-sm text-gray-600">Total Books</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalBooks }}</p>
            </div>
            <div class="bg-green-50 rounded-lg p-4">
              <p class="text-sm text-gray-600">Total Chunks</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalDocuments?.toLocaleString() }}</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4">
              <p class="text-sm text-gray-600">Storage</p>
              <p class="text-2xl font-bold text-gray-900">{{ books.length }} books</p>
            </div>
          </div>

          <!-- Books Table -->
          <div v-if="loading" class="text-center py-8">
            <svg class="animate-spin h-8 w-8 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-2 text-gray-600">Loading books...</p>
          </div>

          <div v-else-if="books.length === 0" class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <p class="mt-2 text-gray-600">No books uploaded yet</p>
            <p class="text-sm text-gray-500">Upload a PDF book to get started</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chunks</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="book in books" :key="book.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ book.title }}</div>
                    <div class="text-xs text-gray-500">{{ book.id }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900">{{ book.chunkCount?.toLocaleString() }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900">{{ book.totalTokens?.toLocaleString() }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(book.uploadedAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="deleteBook(book.id)"
                      :disabled="deleting === book.id"
                      class="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      <span v-if="deleting !== book.id">Delete</span>
                      <span v-else class="flex items-center">
                        <svg class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  ssr: false
})

interface Book {
  id: string
  title: string
  uploadedAt: string
  chunkCount: number
  totalTokens: number
}

interface Stats {
  totalBooks: number
  totalDocuments: number
}

const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const uploadResult = ref<{ success: boolean; message: string; bookId?: string; chunksCount?: number; totalTokens?: number } | null>(null)
const books = ref<Book[]>([])
const stats = ref<Stats | null>(null)
const loading = ref(false)
const deleting = ref<string | null>(null)

// Search state
const searchQuery = ref('')
const searchThreshold = ref(0.7)
const searchLimit = ref(5)
const searching = ref(false)
const searchResults = ref<{
  success: boolean
  query: string
  resultsCount: number
  limit: number
  threshold: number
  results: Array<{
    similarity: number
    content: string
    metadata: {
      bookTitle: string
      citation: string
      bookId: string
      chunkIndex: number | string
      tokenEstimate: number
    }
  }>
} | null>(null)

const loadBooks = async () => {
  loading.value = true
  try {
    const response = await $fetch<{ success: boolean; books: Book[]; stats: Stats }>('/api/books')
    if (response.success) {
      books.value = response.books
      stats.value = response.stats
    }
  } catch (error: any) {
    console.error('Failed to load books:', error)
    alert('Failed to load books: ' + (error.message || 'Unknown error'))
  } finally {
    loading.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const file = input.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file')
      return
    }
    selectedFile.value = file
    uploadResult.value = null
  }
}

const clearSelection = () => {
  selectedFile.value = null
  uploadResult.value = null
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  if (input) input.value = ''
}

const uploadFile = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = 'Preparing upload...'
  uploadResult.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    uploadStatus.value = 'Uploading PDF...'
    uploadProgress.value = 20

    const response = await $fetch<{
      success: boolean
      message: string
      bookId: string
      bookTitle: string
      chunksCount: number
      totalTokens: number
      fileName: string
    }>('/api/books/upload', {
      method: 'POST',
      body: formData
    })

    uploadStatus.value = 'Processing PDF...'
    uploadProgress.value = 50

    uploadStatus.value = 'Chunking text...'
    uploadProgress.value = 70

    uploadStatus.value = 'Generating embeddings...'
    uploadProgress.value = 85

    uploadStatus.value = 'Storing in vector store...'
    uploadProgress.value = 95

    if (response.success) {
      uploadProgress.value = 100
      uploadStatus.value = 'Complete!'
      uploadResult.value = {
        success: true,
        message: `Successfully processed "${response.fileName}"`,
        bookId: response.bookId,
        chunksCount: response.chunksCount,
        totalTokens: response.totalTokens
      }
      selectedFile.value = null
      clearSelection()
      await loadBooks()
    } else {
      throw new Error(response.message || 'Upload failed')
    }
  } catch (error: any) {
    console.error('Upload failed:', error)
    console.error('Upload error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      data: error.data,
      response: error.response,
    })
    
    // Try to extract detailed error message from response
    let errorMessage = error.message || 'Failed to upload and process PDF'
    
    // Check various possible error locations
    if (error.data) {
      console.log('Error data:', error.data)
      if (typeof error.data === 'string') {
        errorMessage = error.data
      } else if (error.data.message) {
        errorMessage = error.data.message
      } else if (error.data.error) {
        errorMessage = error.data.error
      } else if (error.data.data?.error) {
        errorMessage = error.data.data.error
      }
    }
    
    if (error.response) {
      console.log('Error response:', error.response)
      try {
        const responseData = error.response._data || error.response.data
        if (responseData) {
          if (responseData.message) errorMessage = responseData.message
          else if (responseData.error) errorMessage = responseData.error
          else if (responseData.data?.error) errorMessage = responseData.data.error
        }
      } catch (e) {
        console.warn('Could not parse response data:', e)
      }
    }
    
    // Log full error for debugging
    console.error('Final error message:', errorMessage)
    console.error('Full error object:', error)
    console.error('Error data expanded:', error.data)
    console.error('Error response expanded:', error.response?._data)
    
    // Show detailed error in UI
    let detailedMessage = errorMessage
    if (error.data && typeof error.data === 'object') {
      const dataStr = JSON.stringify(error.data, null, 2)
      detailedMessage = `${errorMessage}\n\nDetails:\n${dataStr.substring(0, 500)}`
    }
    
    uploadResult.value = {
      success: false,
      message: detailedMessage
    }
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    uploadStatus.value = ''
  }
}

const deleteBook = async (bookId: string) => {
  if (!confirm(`Are you sure you want to delete this book? This will remove all ${books.value.find(b => b.id === bookId)?.chunkCount || 0} chunks.`)) {
    return
  }

  deleting.value = bookId
  try {
    const response = await $fetch<{ success: boolean; message: string; deletedCount: number }>(`/api/books/${bookId}`, {
      method: 'DELETE'
    })
    if (response.success) {
      await loadBooks()
      alert(`Successfully deleted book (${response.deletedCount} chunks removed)`)
    }
  } catch (error: any) {
    console.error('Failed to delete book:', error)
    alert('Failed to delete book: ' + (error.message || 'Unknown error'))
  } finally {
    deleting.value = null
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    return
  }

  searching.value = true
  searchResults.value = null

  try {
    const params = new URLSearchParams({
      q: searchQuery.value.trim(),
      limit: searchLimit.value.toString(),
      threshold: searchThreshold.value.toString(),
    })

    const response = await $fetch<{
      success: boolean
      query: string
      resultsCount: number
      limit: number
      threshold: number
      results: Array<{
        similarity: number
        content: string
        metadata: {
          bookTitle: string
          citation: string
          bookId: string
          chunkIndex: number | string
          tokenEstimate: number
        }
      }>
    }>(`/api/books/search?${params.toString()}`)

    if (response.success) {
      searchResults.value = response
    } else {
      alert('Search failed: ' + (response as any).message || 'Unknown error')
    }
  } catch (error: any) {
    console.error('Search failed:', error)
    alert('Search failed: ' + (error.message || 'Unknown error'))
  } finally {
    searching.value = false
  }
}

// Load books on mount
onMounted(() => {
  loadBooks()
})
</script>

