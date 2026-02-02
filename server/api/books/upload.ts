import { readMultipartFormData } from "h3";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { paragraphChunk } from "../../utils/pdfChunker";
import { embedChunks } from "../utils/embeddings";
import { addDocuments } from "../../utils/vectorStore";

const UPLOAD_DIR = join(process.cwd(), "server", "data", "uploads");

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Save uploaded file to temporary location
 */
async function saveUploadedFile(file: { data: Buffer; filename: string }): Promise<string> {
  try {
    await ensureUploadDir();
    console.log("[Book Upload] Upload directory ensured:", UPLOAD_DIR);
  } catch (error: any) {
    console.error("[Book Upload] Error ensuring upload directory:", error);
    throw new Error(`Failed to create upload directory: ${error.message}`);
  }
  
  const fileName = `${Date.now()}_${file.filename}`;
  const filePath = join(UPLOAD_DIR, fileName);
  
  try {
    await writeFile(filePath, file.data);
    console.log("[Book Upload] File saved to:", filePath);
  } catch (error: any) {
    console.error("[Book Upload] Error saving file:", error);
    throw new Error(`Failed to save file: ${error.message}`);
  }
  
  return filePath;
}

/**
 * Delete temporary file
 */
async function deleteFile(filePath: string): Promise<void> {
  try {
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch (error) {
    console.error(`[Book Upload] Error deleting file ${filePath}:`, error);
  }
}

export default defineEventHandler(async (event) => {
  // Wrap everything in try-catch to catch any errors including import errors
  try {
    // Only accept POST requests
    if (event.method !== "POST") {
      throw createError({
        statusCode: 405,
        message: "Method not allowed. Use POST.",
      });
    }

    let tempFilePath: string | null = null;

    try {
      console.log("[Book Upload] Starting upload process...");
    
    // Parse multipart form data
    const formData = await readMultipartFormData(event);
    
    if (!formData || formData.length === 0) {
      console.error("[Book Upload] No form data entries found");
      throw createError({
        statusCode: 400,
        message: "No file provided",
      });
    }
    
    console.log("[Book Upload] Form data parsed, entries:", formData.length);

    // Find the file in form data
    const fileEntry = formData.find((entry) => entry.name === "file" && entry.data);
    
    if (!fileEntry) {
      console.error("[Book Upload] No file entry found in form data. Available entries:", formData.map(e => e.name));
      throw createError({
        statusCode: 400,
        message: "No file provided in form data",
      });
    }
    
    if (!fileEntry.data) {
      console.error("[Book Upload] File entry found but data is empty");
      throw createError({
        statusCode: 400,
        message: "File data is empty",
      });
    }
    
    console.log("[Book Upload] File found:", fileEntry.filename, "Size:", fileEntry.data.length, "bytes");

    // Validate file type
    const fileName = fileEntry.filename || "unknown.pdf";
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      throw createError({
        statusCode: 400,
        message: "File must be a PDF",
      });
    }

    // Save file temporarily
    tempFilePath = await saveUploadedFile({
      data: fileEntry.data,
      filename: fileName,
    });

    console.log(`[Book Upload] Processing PDF: ${fileName}`);

    // Step 1: Chunk the PDF
    let chunks;
    try {
      console.log(`[Book Upload] Starting PDF chunking for: ${tempFilePath}`);
      chunks = await paragraphChunk(tempFilePath, fileName);
      console.log(`[Book Upload] Generated ${chunks.length} chunks`);
    } catch (error: any) {
      console.error("[Book Upload] Error in chunking:", error);
      console.error("[Book Upload] Error stack:", error.stack);
      throw createError({
        statusCode: 500,
        message: `PDF chunking failed: ${error?.message || "Unknown error"}. ${error?.stack ? `Stack: ${error.stack.substring(0, 200)}` : ""}`,
      });
    }

    if (chunks.length === 0) {
      throw createError({
        statusCode: 400,
        message: "No chunks generated from PDF. The PDF might be empty or contain only images.",
      });
    }

    // Step 2: Generate embeddings
    let embeddings;
    try {
      console.log(`[Book Upload] Generating embeddings for ${chunks.length} chunks...`);
      embeddings = await embedChunks(chunks);
      console.log(`[Book Upload] Generated ${embeddings.length} embeddings`);
    } catch (error) {
      console.error("[Book Upload] Error generating embeddings:", error);
      throw createError({
        statusCode: 500,
        message: `Embedding generation failed: ${error instanceof Error ? error.message : "Unknown error"}. Make sure OPENAI_API_KEY is set.`,
      });
    }

    if (embeddings.length !== chunks.length) {
      throw createError({
        statusCode: 500,
        message: `Mismatch: ${chunks.length} chunks but ${embeddings.length} embeddings`,
      });
    }

    // Step 3: Store in vector store
    const bookId = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const bookTitle = fileName.replace(/\.pdf$/i, "");

    try {
      console.log(`[Book Upload] Storing ${chunks.length} chunks in vector store...`);
      
      const documents = chunks.map((chunk, index) => ({
        content: chunk.content,
        embedding: embeddings[index],
        metadata: {
          bookId,
          bookTitle,
          source: chunk.metadata.source,
          citation: chunk.metadata.citation,
          chunkIndex: index,
          tokenEstimate: chunk.metadata.tokenEstimate,
          paragraphCount: chunk.metadata.paragraphCount,
          hasOverlap: chunk.metadata.hasOverlap,
        },
      }));

      await addDocuments(documents);
      console.log(`[Book Upload] Successfully stored ${documents.length} chunks`);
    } catch (error) {
      console.error("[Book Upload] Error storing in vector store:", error);
      throw createError({
        statusCode: 500,
        message: `Vector store storage failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Calculate total tokens
    const totalTokens = chunks.reduce((sum, c) => sum + c.metadata.tokenEstimate, 0);

    return {
      success: true,
      message: "PDF processed successfully",
      bookId,
      bookTitle,
      chunksCount: chunks.length,
      totalTokens,
      fileName,
    };
  } catch (error: any) {
    console.error("=".repeat(80));
    console.error("[Book Upload] ERROR PROCESSING PDF");
    console.error("=".repeat(80));
    console.error("[Book Upload] Error message:", error?.message);
    console.error("[Book Upload] Error name:", error?.name);
    console.error("[Book Upload] Error statusCode:", error?.statusCode);
    if (error?.stack) {
      console.error("[Book Upload] Error stack:");
      console.error(error.stack);
    }
    console.error("[Book Upload] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("=".repeat(80));
    
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Otherwise, create a generic error with more details
    const errorMessage = error?.message || "Failed to process PDF";
    throw createError({
      statusCode: 500,
      message: errorMessage,
      data: {
        error: errorMessage,
        errorName: error?.name,
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
    });
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      await deleteFile(tempFilePath);
    }
    }
  } catch (outerError: any) {
    // Catch any errors that occur outside the inner try-catch (like import errors)
    console.error("=".repeat(80));
    console.error("[Book Upload] OUTER ERROR - This might be an import or setup error");
    console.error("=".repeat(80));
    console.error("[Book Upload] Error message:", outerError?.message);
    console.error("[Book Upload] Error name:", outerError?.name);
    console.error("[Book Upload] Error stack:", outerError?.stack);
    console.error("=".repeat(80));
    
    throw createError({
      statusCode: 500,
      message: outerError?.message || "Internal server error during upload",
      data: {
        error: outerError?.message,
        errorName: outerError?.name,
        stack: process.env.NODE_ENV === "development" ? outerError?.stack : undefined,
      },
    });
  }
});

