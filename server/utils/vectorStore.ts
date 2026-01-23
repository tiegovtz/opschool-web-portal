import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import { embedQuery } from "../api/utils/embeddings";

interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    bookId: string;
    bookTitle: string;
    source: string;
    citation: string;
    chunkIndex: number;
    tokenEstimate: number;
    paragraphCount?: number;
    hasOverlap?: boolean;
    uploadedAt: string;
  };
}

interface BookInfo {
  id: string;
  title: string;
  uploadedAt: string;
  chunkCount: number;
  totalPages?: number;
  totalTokens: number;
}

interface VectorStore {
  version: string;
  createdAt: string;
  updatedAt: string;
  books: Record<string, BookInfo>;
  documents: VectorDocument[];
}

const VECTOR_STORE_FILE = join(process.cwd(), 'server', 'data', 'vector-store.json');
const SIMILARITY_THRESHOLD = 0.5; // Minimum similarity score to return results (0.7 was too strict)
const MAX_RESULTS = 10; // Maximum number of results to return

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Load vector store from file
 */
async function loadVectorStore(): Promise<VectorStore> {
  try {
    const fileContent = await readFile(VECTOR_STORE_FILE, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    // If file doesn't exist, create empty store
    if (error.code === 'ENOENT') {
      return {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        books: {},
        documents: [],
      };
    }
    throw error;
  }
}

/**
 * Save vector store to file
 */
async function saveVectorStore(store: VectorStore): Promise<void> {
  store.updatedAt = new Date().toISOString();
  
  // Ensure directory exists
  const dir = dirname(VECTOR_STORE_FILE);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  
  await writeFile(VECTOR_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

/**
 * Add a single document to the vector store
 */
export async function addDocument(
  content: string,
  embedding: number[],
  metadata: Omit<VectorDocument['metadata'], 'uploadedAt'>
): Promise<string> {
  if (!content || content.trim().length === 0) {
    throw new Error("Content cannot be empty");
  }

  if (!embedding || embedding.length === 0) {
    throw new Error("Embedding cannot be empty");
  }

  const store = await loadVectorStore();
  
  // Create document
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const document: VectorDocument = {
    id: docId,
    content: content.trim(),
    embedding,
    metadata: {
      ...metadata,
      uploadedAt: new Date().toISOString(),
    },
  };
  
  store.documents.push(document);
  
  // Update book info
  if (!store.books[metadata.bookId]) {
    store.books[metadata.bookId] = {
      id: metadata.bookId,
      title: metadata.bookTitle,
      uploadedAt: new Date().toISOString(),
      chunkCount: 0,
      totalTokens: 0,
    };
  }
  store.books[metadata.bookId].chunkCount += 1;
  store.books[metadata.bookId].totalTokens += metadata.tokenEstimate;
  
  await saveVectorStore(store);
  
  console.log(`[VectorStore] Added document: ${docId} (${content.substring(0, 50)}...)`);
  return docId;
}

/**
 * Add multiple documents in batch
 */
export async function addDocuments(
  documents: Array<{
    content: string;
    embedding: number[];
    metadata: Omit<VectorDocument['metadata'], 'uploadedAt'>;
  }>
): Promise<string[]> {
  if (documents.length === 0) {
    return [];
  }

  const store = await loadVectorStore();
  const docIds: string[] = [];
  const bookCounts: Record<string, { count: number; tokens: number }> = {};
  
  for (const { content, embedding, metadata } of documents) {
    if (!content || content.trim().length === 0) continue;
    if (!embedding || embedding.length === 0) continue;
    
    try {
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      store.documents.push({
        id: docId,
        content: content.trim(),
        embedding,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
        },
      });
      
      docIds.push(docId);
      
      // Track book stats
      if (!bookCounts[metadata.bookId]) {
        bookCounts[metadata.bookId] = { count: 0, tokens: 0 };
      }
      bookCounts[metadata.bookId].count += 1;
      bookCounts[metadata.bookId].tokens += metadata.tokenEstimate;
    } catch (error) {
      console.warn(`[VectorStore] Failed to add document: ${error}`);
    }
  }
  
  if (docIds.length > 0) {
    // Update book info
    for (const [bookId, stats] of Object.entries(bookCounts)) {
      const firstDoc = documents.find(d => d.metadata.bookId === bookId);
      if (firstDoc) {
        if (!store.books[bookId]) {
          store.books[bookId] = {
            id: bookId,
            title: firstDoc.metadata.bookTitle,
            uploadedAt: new Date().toISOString(),
            chunkCount: 0,
            totalTokens: 0,
          };
        }
        store.books[bookId].chunkCount += stats.count;
        store.books[bookId].totalTokens += stats.tokens;
      }
    }
    
    await saveVectorStore(store);
    console.log(`[VectorStore] Added ${docIds.length} documents`);
  }
  
  return docIds;
}

/**
 * Search for similar documents
 */
export async function search(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    filter?: (doc: VectorDocument) => boolean;
  } = {}
): Promise<Array<{ document: VectorDocument; similarity: number }>> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const store = await loadVectorStore();
  
  if (store.documents.length === 0) {
    console.log("[VectorStore] No documents in store");
    return [];
  }

  // Generate query embedding
  console.log(`[VectorStore] Generating embedding for query: "${query.substring(0, 100)}"`);
  const queryEmbedding = await embedQuery(query.trim());
  console.log(`[VectorStore] Query embedding generated, length: ${queryEmbedding.length}`);
  
  // Check if documents have embeddings
  const docsWithEmbeddings = store.documents.filter(doc => doc.embedding && doc.embedding.length > 0);
  console.log(`[VectorStore] Total documents: ${store.documents.length}, Documents with embeddings: ${docsWithEmbeddings.length}`);
  
  if (docsWithEmbeddings.length === 0) {
    console.error(`[VectorStore] ERROR: No documents have embeddings! All ${store.documents.length} documents are missing embeddings.`);
    return [];
  }
  
  // Check embedding dimension mismatch
  if (docsWithEmbeddings.length > 0 && docsWithEmbeddings[0].embedding.length !== queryEmbedding.length) {
    console.error(`[VectorStore] ERROR: Embedding dimension mismatch! Query: ${queryEmbedding.length}, Documents: ${docsWithEmbeddings[0].embedding.length}`);
    return [];
  }
  
  // Calculate similarities
  const allSimilarities = store.documents
    .map((doc) => {
      // Apply filter if provided
      if (options.filter && !options.filter(doc)) {
        return null;
      }
      
      // Skip documents without embeddings
      if (!doc.embedding || doc.embedding.length === 0) {
        return null;
      }
      
      // Check dimension match
      if (doc.embedding.length !== queryEmbedding.length) {
        console.warn(`[VectorStore] Dimension mismatch for doc ${doc.id}: doc=${doc.embedding.length}, query=${queryEmbedding.length}`);
        return null;
      }
      
      const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
      return { document: doc, similarity };
    })
    .filter((result): result is { document: VectorDocument; similarity: number } => {
      return result !== null;
    });

  console.log(`[VectorStore] Calculated similarities for ${allSimilarities.length} documents`);

  // Log top similarities for debugging
  const topSimilarities = [...allSimilarities]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10); // Show top 10 for debugging
  console.log(`[VectorStore] Top 10 similarities: ${topSimilarities.map((r, i) => `${i+1}. ${r.similarity.toFixed(4)}`).join(", ")}`);

  // Filter by threshold
  const threshold = options.threshold ?? SIMILARITY_THRESHOLD;
  const results = allSimilarities
    .filter((result) => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, options.limit ?? MAX_RESULTS);

  console.log(`[VectorStore] Search for "${query.substring(0, 50)}..." found ${results.length} results (threshold: ${threshold})`);
  if (results.length === 0 && allSimilarities.length > 0) {
    console.log(`[VectorStore] ⚠️ No results above threshold ${threshold}. Highest similarity was: ${topSimilarities[0]?.similarity.toFixed(4)}`);
    console.log(`[VectorStore] ⚠️ Consider lowering threshold if highest similarity is close to ${threshold}`);
  }
  return results;
}

/**
 * Search with progressive threshold fallback
 * Tries multiple thresholds automatically until results are found
 * 
 * @param query - The search query
 * @param options - Search options including initial threshold
 * @returns Search results with quality indicators
 */
export async function searchWithProgressiveThreshold(
  query: string,
  options: {
    limit?: number;
    initialThreshold?: number;
    filter?: (doc: VectorDocument) => boolean;
  } = {}
): Promise<{
  results: Array<{ document: VectorDocument; similarity: number }>;
  thresholdUsed: number;
  qualityLevel: 'high' | 'medium' | 'low' | 'very_low';
  averageSimilarity: number;
}> {
  if (!query || query.trim().length === 0) {
    return {
      results: [],
      thresholdUsed: 0,
      qualityLevel: 'very_low',
      averageSimilarity: 0,
    };
  }

  // Progressive thresholds to try (from highest to lowest)
  const thresholds = [
    options.initialThreshold ?? 0.7, // Start with requested or default high threshold
    0.5,  // Medium quality
    0.3,  // Lower quality but still relevant
    0.1,  // Very permissive (only if nothing else works)
  ];

  // Remove duplicates and sort descending
  const uniqueThresholds = [...new Set(thresholds)].sort((a, b) => b - a);

  console.log(`[VectorStore] Progressive search for: "${query.substring(0, 50)}..." (trying thresholds: ${uniqueThresholds.join(', ')})`);

  // Try each threshold until we find results
  for (const threshold of uniqueThresholds) {
    const results = await search(query, {
      limit: options.limit,
      threshold,
      filter: options.filter,
    });

    if (results.length > 0) {
      // Calculate quality metrics
      const averageSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
      
      // Determine quality level based on threshold used
      let qualityLevel: 'high' | 'medium' | 'low' | 'very_low';
      if (threshold >= 0.7) {
        qualityLevel = 'high';
      } else if (threshold >= 0.5) {
        qualityLevel = 'medium';
      } else if (threshold >= 0.3) {
        qualityLevel = 'low';
      } else {
        qualityLevel = 'very_low';
      }

      console.log(`[VectorStore] Progressive search found ${results.length} results at threshold ${threshold} (quality: ${qualityLevel}, avg similarity: ${averageSimilarity.toFixed(4)})`);

      return {
        results,
        thresholdUsed: threshold,
        qualityLevel,
        averageSimilarity,
      };
    } else {
      console.log(`[VectorStore] Progressive search: No results at threshold ${threshold}, trying next threshold...`);
    }
  }

  // No results found at any threshold
  console.log(`[VectorStore] Progressive search: No results found at any threshold for: "${query.substring(0, 50)}..."`);
  return {
    results: [],
    thresholdUsed: uniqueThresholds[uniqueThresholds.length - 1], // Last threshold tried
    qualityLevel: 'very_low',
    averageSimilarity: 0,
  };
}

/**
 * Get store statistics
 */
export async function getStats(): Promise<{
  totalDocuments: number;
  totalBooks: number;
  byBook: Record<string, number>;
}> {
  const store = await loadVectorStore();
  
  const stats = {
    totalDocuments: store.documents.length,
    totalBooks: Object.keys(store.books).length,
    byBook: {} as Record<string, number>,
  };
  
  Object.values(store.books).forEach((book) => {
    stats.byBook[book.title] = book.chunkCount;
  });
  
  return stats;
}

/**
 * List all books in the store
 */
export async function listBooks(): Promise<BookInfo[]> {
  const store = await loadVectorStore();
  return Object.values(store.books).sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

/**
 * Get book by ID
 */
export async function getBookById(bookId: string): Promise<BookInfo | null> {
  const store = await loadVectorStore();
  return store.books[bookId] || null;
}

/**
 * Delete all documents for a specific book
 */
export async function deleteByBookId(bookId: string): Promise<number> {
  const store = await loadVectorStore();
  
  const initialCount = store.documents.length;
  store.documents = store.documents.filter(doc => doc.metadata.bookId !== bookId);
  const deletedCount = initialCount - store.documents.length;
  
  // Remove book from books record
  if (store.books[bookId]) {
    delete store.books[bookId];
  }
  
  if (deletedCount > 0) {
    await saveVectorStore(store);
    console.log(`[VectorStore] Deleted ${deletedCount} documents for book: ${bookId}`);
  }
  
  return deletedCount;
}

/**
 * Get all documents for a specific book
 */
export async function getDocumentsByBookId(bookId: string): Promise<VectorDocument[]> {
  const store = await loadVectorStore();
  return store.documents.filter(doc => doc.metadata.bookId === bookId);
}

/**
 * Clear all documents (use with caution)
 */
export async function clearStore(): Promise<void> {
  const store: VectorStore = {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    books: {},
    documents: [],
  };
  await saveVectorStore(store);
  console.log("[VectorStore] Store cleared");
}

