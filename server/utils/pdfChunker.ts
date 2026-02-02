import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { existsSync } from "fs";

// Configuration from environment
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || "800");
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || "150");
const MIN_PAGE_LENGTH = parseInt(process.env.MIN_PAGE_LENGTH || "50");

export interface ParagraphChunk {
  content: string;
  metadata: {
    source: string;
    citation: string;
    tokenEstimate: number;
    paragraphCount: number;
    hasOverlap: boolean;
  };
}

interface PageInfo {
  pageNumber: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Split text into paragraphs by double newlines
 */
function splitIntoParagraphs(text: string): string[] {
  // Normalize line endings and split by double newlines
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  
  // Split by double newlines (paragraph breaks)
  const rawParagraphs = normalized.split(/\n\s*\n/);
  
  // Clean and filter paragraphs
  return rawParagraphs
    .map(p => p.replace(/\s+/g, " ").trim())
    .filter(p => p.length > 20); // Filter out very short fragments
}

/**
 * Group paragraphs into chunks respecting size limits
 */
function groupParagraphs(
  paragraphs: string[],
  chunkSize: number = CHUNK_SIZE
): Array<{ paragraphs: string[]; indices: number[] }> {
  const chunks: Array<{ paragraphs: string[]; indices: number[] }> = [];
  
  let currentParagraphs: string[] = [];
  let currentIndices: number[] = [];
  let currentLength = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const paragraphLength = paragraph.length;
    
    // If adding this paragraph would exceed chunk size and we have content
    if (currentLength + paragraphLength > chunkSize && currentParagraphs.length > 0) {
      // Save current chunk
      chunks.push({
        paragraphs: [...currentParagraphs],
        indices: [...currentIndices],
      });
      
      // Start new chunk
      currentParagraphs = [];
      currentIndices = [];
      currentLength = 0;
    }
    
    // Add paragraph to current chunk
    currentParagraphs.push(paragraph);
    currentIndices.push(i);
    currentLength += paragraphLength + 2; // +2 for paragraph separator
    
    // If single paragraph exceeds chunk size, save it as its own chunk
    if (paragraphLength > chunkSize && currentParagraphs.length === 1) {
      chunks.push({
        paragraphs: [...currentParagraphs],
        indices: [...currentIndices],
      });
      currentParagraphs = [];
      currentIndices = [];
      currentLength = 0;
    }
  }
  
  // Don't forget the last chunk
  if (currentParagraphs.length > 0) {
    chunks.push({
      paragraphs: currentParagraphs,
      indices: currentIndices,
    });
  }
  
  return chunks;
}

/**
 * Add overlap between chunks by including trailing paragraphs from previous chunk
 */
function addOverlap(
  chunks: Array<{ paragraphs: string[]; indices: number[] }>,
  allParagraphs: string[],
  overlapSize: number = CHUNK_OVERLAP
): Array<{ paragraphs: string[]; indices: number[]; hasOverlap: boolean }> {
  if (chunks.length <= 1) {
    return chunks.map(c => ({ ...c, hasOverlap: false }));
  }
  
  const overlappedChunks: Array<{ paragraphs: string[]; indices: number[]; hasOverlap: boolean }> = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    if (i === 0) {
      // First chunk has no overlap
      overlappedChunks.push({ ...chunk, hasOverlap: false });
    } else {
      // Add overlap from previous chunk
      const prevChunk = chunks[i - 1];
      let overlapParagraphs: string[] = [];
      let overlapIndices: number[] = [];
      let overlapLength = 0;
      
      // Add paragraphs from end of previous chunk until we hit overlap size
      for (let j = prevChunk.paragraphs.length - 1; j >= 0 && overlapLength < overlapSize; j--) {
        const para = prevChunk.paragraphs[j];
        overlapParagraphs.unshift(para);
        overlapIndices.unshift(prevChunk.indices[j]);
        overlapLength += para.length;
      }
      
      overlappedChunks.push({
        paragraphs: [...overlapParagraphs, ...chunk.paragraphs],
        indices: [...overlapIndices, ...chunk.indices],
        hasOverlap: overlapParagraphs.length > 0,
      });
    }
  }
  
  return overlappedChunks;
}

/**
 * Load PDF and extract text with page information
 */
async function loadPdfText(filePath: string): Promise<{
  fullText: string;
  pageMap: PageInfo[];
  pageCount: number;
}> {
  console.log(`[PDF Chunker] Loading PDF from: ${filePath}`);
  console.log(`[PDF Chunker] File exists: ${existsSync(filePath)}`);
  
  let loader;
  try {
    console.log(`[PDF Chunker] Creating PDFLoader...`);
    loader = new PDFLoader(filePath);
    console.log(`[PDF Chunker] PDFLoader created successfully`);
  } catch (error: any) {
    console.error(`[PDF Chunker] Error creating PDFLoader:`, error);
    console.error(`[PDF Chunker] Error stack:`, error.stack);
    throw new Error(`Failed to create PDFLoader: ${error.message || "Unknown error"}`);
  }
  
  let docs;
  try {
    console.log(`[PDF Chunker] Loading PDF documents...`);
    docs = await loader.load();
    console.log(`[PDF Chunker] Loaded ${docs.length} documents from PDF`);
  } catch (error: any) {
    console.error(`[PDF Chunker] Error loading PDF:`, error);
    console.error(`[PDF Chunker] Error stack:`, error.stack);
    throw new Error(`Failed to load PDF: ${error.message || "Unknown error"}. ${error.stack ? `Stack: ${error.stack.substring(0, 300)}` : ""}`);
  }

  let fullText = "";
  const pageMap: PageInfo[] = [];
  let currentIndex = 0;

  for (const doc of docs) {
    const pageNum = doc.metadata.loc?.pageNumber || 1;
    const content = doc.pageContent;

    if (content.length < MIN_PAGE_LENGTH) continue;

    const start = currentIndex;
    const end = currentIndex + content.length;

    pageMap.push({
      pageNumber: pageNum,
      startIndex: start,
      endIndex: end,
    });

    fullText += content + "\n\n"; // Preserve paragraph breaks between pages
    currentIndex = end + 2;
  }

  return {
    fullText: fullText.trim(),
    pageMap,
    pageCount: docs.length,
  };
}

/**
 * Find page citation for a chunk based on its content position
 */
function findPageCitation(
  chunkContent: string,
  fullText: string,
  pageMap: PageInfo[]
): string {
  const chunkStart = fullText.indexOf(chunkContent.substring(0, 100));
  if (chunkStart === -1) return "Unknown";
  
  const chunkEnd = chunkStart + chunkContent.length;

  const spanningPages = pageMap.filter(
    (p) =>
      (chunkStart >= p.startIndex && chunkStart < p.endIndex) ||
      (chunkEnd > p.startIndex && chunkEnd <= p.endIndex) ||
      (chunkStart < p.startIndex && chunkEnd > p.endIndex)
  );

  if (spanningPages.length === 0) return "Unknown";

  const startPage = spanningPages[0].pageNumber;
  const endPage = spanningPages[spanningPages.length - 1].pageNumber;

  if (startPage === endPage) {
    return `Page ${startPage}`;
  }
  return `Pages ${startPage}-${endPage}`;
}

/**
 * Main paragraph-based chunking function
 */
export async function paragraphChunk(
  filePath: string,
  fileName: string
): Promise<ParagraphChunk[]> {
  console.log(`[PDF Chunker] Starting paragraph-based chunking for: ${filePath}`);

  // 1. Load PDF
  const { fullText, pageMap, pageCount } = await loadPdfText(filePath);
  console.log(`[PDF Chunker] Loaded ${pageCount} pages, ${fullText.length} characters`);

  // 2. Split into paragraphs
  const paragraphs = splitIntoParagraphs(fullText);
  console.log(`[PDF Chunker] Split into ${paragraphs.length} paragraphs`);

  if (paragraphs.length === 0) {
    throw new Error("No paragraphs extracted from PDF");
  }

  // 3. Group paragraphs into chunks
  const groupedChunks = groupParagraphs(paragraphs, CHUNK_SIZE);
  console.log(`[PDF Chunker] Grouped into ${groupedChunks.length} initial chunks`);

  // 4. Add overlap between chunks
  const overlappedChunks = addOverlap(groupedChunks, paragraphs, CHUNK_OVERLAP);
  console.log(`[PDF Chunker] Added overlap, final chunk count: ${overlappedChunks.length}`);

  // 5. Build final chunks with metadata
  const finalChunks: ParagraphChunk[] = overlappedChunks.map((chunk) => {
    const content = chunk.paragraphs.join("\n\n");
    const citation = findPageCitation(content, fullText, pageMap);

    return {
      content,
      metadata: {
        source: fileName,
        citation,
        tokenEstimate: Math.round(content.length / 4),
        paragraphCount: chunk.paragraphs.length,
        hasOverlap: chunk.hasOverlap,
      },
    };
  });

  console.log(`[PDF Chunker] Generated ${finalChunks.length} paragraph-based chunks`);
  return finalChunks;
}

