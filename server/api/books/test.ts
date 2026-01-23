import { paragraphChunk } from "../../utils/pdfChunker";

/**
 * Test endpoint to verify PDF chunking works
 * GET /api/books/test
 */
export default defineEventHandler(async (event) => {
  try {
    // Check if PDFLoader can be imported
    let pdfLoaderStatus = "unknown";
    try {
      const { PDFLoader } = await import("@langchain/community/document_loaders/fs/pdf");
      pdfLoaderStatus = "✅ PDFLoader imported successfully";
    } catch (error: any) {
      pdfLoaderStatus = `❌ PDFLoader import failed: ${error.message}`;
    }

    // Check if embeddings can be imported
    let embeddingsStatus = "unknown";
    try {
      const { embedChunks } = await import("../utils/embeddings");
      embeddingsStatus = "✅ embedChunks imported successfully";
    } catch (error: any) {
      embeddingsStatus = `❌ embedChunks import failed: ${error.message}`;
    }

    // Check if vector store can be imported
    let vectorStoreStatus = "unknown";
    try {
      const { addDocuments } = await import("../../utils/vectorStore");
      vectorStoreStatus = "✅ vectorStore imported successfully";
    } catch (error: any) {
      vectorStoreStatus = `❌ vectorStore import failed: ${error.message}`;
    }

    // Check OpenAI API key
    const config = useRuntimeConfig();
    const hasApiKey = !!(config.OPENAI_API_KEY || config.openaiApiKey || process.env.OPENAI_API_KEY);
    const apiKeyStatus = hasApiKey ? "✅ OpenAI API key found" : "❌ OpenAI API key missing";

    // Check directories
    const { existsSync } = await import("fs");
    const { join } = await import("path");
    const uploadDir = join(process.cwd(), "server", "data", "uploads");
    const dataDir = join(process.cwd(), "server", "data");
    const uploadDirExists = existsSync(uploadDir);
    const dataDirExists = existsSync(dataDir);

    return {
      success: true,
      status: "System check complete",
      checks: {
        pdfLoader: pdfLoaderStatus,
        embeddings: embeddingsStatus,
        vectorStore: vectorStoreStatus,
        openaiApiKey: apiKeyStatus,
        directories: {
          dataDir: dataDirExists ? "✅ exists" : "❌ missing",
          uploadDir: uploadDirExists ? "✅ exists" : "❌ missing",
          dataDirPath: dataDir,
          uploadDirPath: uploadDir,
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
});

