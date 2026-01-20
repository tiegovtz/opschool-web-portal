import apiDocs from "~/utilities/apiDocs";

// ============================================
// Types
// ============================================

interface RAGResponseItem {
  content?: string;
  embedding?: number[];
  citation?: string;
  source?: string;
  tokenEstimate?: number;
}

interface RAGResponse {
  data?: RAGResponseItem[];
  results?: RAGResponseItem[];
  content?: string;
  text?: string;
}

// ============================================
// RAG Utility Functions
// ============================================

/**
 * Extracts text content from various RAG response item formats
 * Includes source information for citation purposes
 */
function extractTextFromItem(item: any): string {
  if (typeof item === "string") return item;
  
  // Handle RAGResponseItem structure (content, embedding, citation, source, tokenEstimate)
  if (item && typeof item === "object") {
    // Check if it's an empty object
    if (Object.keys(item).length === 0) {
      return "";
    }
    
    // Extract content
    let content = "";
    if (item.content && typeof item.content === "string") {
      content = item.content.trim();
    } else if (item.text) {
      content = String(item.text).trim();
    } else if (item.chunk) {
      content = String(item.chunk).trim();
    } else if (item.passage) {
      content = String(item.passage).trim();
    }
    
    // Return empty if no content
    if (!content) {
      return "";
    }
    
    // Build source information
    const sourceParts: string[] = [];
    if (item.source) {
      sourceParts.push(`Source: ${item.source}`);
    }
    if (item.citation && item.citation !== "Unknown") {
      sourceParts.push(`Citation: ${item.citation}`);
    }
    
    // Format: [Source info] Content
    if (sourceParts.length > 0) {
      return `[${sourceParts.join(" | ")}]\n${content}`;
    }
    
    return content;
  }
  
  return "";
}

/**
 * Parses RAG API response into a single text string
 */
function parseRAGResponse(response: any): string {
  if (Array.isArray(response)) {
    return response
      .map(extractTextFromItem)
      .filter((text: string) => text?.trim().length > 0)
      .join("\n\n");
  }

  if (response && typeof response === "object") {
    const obj = response as RAGResponse;

    if (Array.isArray(obj.data)) {
      return obj.data
        .map(extractTextFromItem)
        .filter((text: string) => text?.trim().length > 0)
        .join("\n\n");
    }

    if (Array.isArray(obj.results)) {
      return obj.results
        .map(extractTextFromItem)
        .filter((text: string) => text?.trim().length > 0)
        .join("\n\n");
    }

    if (obj.content) return String(obj.content);
    if (obj.text) return String(obj.text);
  }

  if (typeof response === "string") {
    return response;
  }

  return "";
}

/**
 * Fetches RAG context from the external embeddings API
 * 
 * @param searchQuery - The search query to find relevant context
 * @param authToken - Optional authentication token to avoid 401 errors
 * @returns Promise<string> - The parsed context text, or empty string if no context found
 */
export async function fetchRAGContext(
  searchQuery: string,
  authToken?: string
): Promise<string> {
  if (!searchQuery?.trim()) {
    return "";
  }

  try {
    const baseURL = apiDocs.baseURL;
    const embeddingsUrl = `${baseURL}/machine-learning/books/embeddings/search?search=${encodeURIComponent(searchQuery.trim())}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header if token is provided
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    console.log("[RAG] Fetching embeddings for query:", searchQuery.substring(0, 100));
    console.log("[RAG] API URL:", embeddingsUrl);

    const response = await $fetch(embeddingsUrl, {
      method: "GET",
      headers,
    });

    // Log the raw RAG response
    console.log("[RAG] Raw response received:", JSON.stringify(response, null, 2));
    console.log("[RAG] Response type:", Array.isArray(response) ? "Array" : typeof response);
    
    if (Array.isArray(response)) {
      console.log("[RAG] Response is an array with", response.length, "items");
      
      // Log details about each item in the array
      response.forEach((item: RAGResponseItem, index: number) => {
        if (!item || Object.keys(item).length === 0) {
          console.log(`[RAG] Item ${index}: Empty object`);
          return;
        }
        
        const hasContent = item.content && item.content.trim().length > 0;
        console.log(`[RAG] Item ${index}:`, {
          hasContent,
          contentLength: item.content?.length || 0,
          source: item.source || "N/A",
          citation: item.citation || "N/A",
          tokenEstimate: item.tokenEstimate || "N/A",
          hasEmbedding: !!item.embedding,
          embeddingLength: item.embedding?.length || 0,
        });
        
        if (hasContent) {
          console.log(`[RAG] Item ${index} content preview:`, item.content?.substring(0, 150));
        }
      });
    } else if (response && typeof response === "object") {
      const obj = response as RAGResponse;
      if (obj.data) {
        console.log("[RAG] Response contains 'data' array with", obj.data.length, "items");
      }
      if (obj.results) {
        console.log("[RAG] Response contains 'results' array with", obj.results.length, "items");
      }
      if (obj.content) {
        console.log("[RAG] Response contains 'content' field (length:", obj.content.length, "chars)");
      }
      if (obj.text) {
        console.log("[RAG] Response contains 'text' field (length:", obj.text.length, "chars)");
      }
    }

    const contextText = parseRAGResponse(response);

    console.log("[RAG] Parsed context text length:", contextText.length, "characters");
    
    // Count unique sources
    if (Array.isArray(response)) {
      const sources = new Set<string>();
      response.forEach((item: RAGResponseItem) => {
        if (item?.source) {
          sources.add(item.source);
        }
      });
      console.log("[RAG] Unique sources found:", Array.from(sources));
    }
    
    if (contextText.trim()) {
      console.log("[RAG] Context text preview (first 300 chars):", contextText.substring(0, 300));
      return contextText.trim();
    }

    console.log("[RAG] No context text extracted from response");
    return "";
  } catch (error: any) {
    console.warn("[RAG] Failed to fetch embeddings:", error?.message || error);
    // Return empty string on error to allow chat to continue without RAG context
    return "";
  }
}
