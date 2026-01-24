import { searchWithProgressiveThreshold } from "./vectorStore";
import { 
  processQuery, 
  processQueryWithLLM,
  isQueryExpansionEnabled, 
  type QueryContext 
} from "./queryProcessor";
// Import external RAG function for internal use only (not re-exported to avoid Nuxt auto-import conflicts)
// Function uses underscore prefix to avoid Nuxt auto-import conflicts
import { _fetchExternalRAGContext as fetchExternalRAG } from "./externalRagApi";

// NOTE: External RAG functions (fetchExternalRAGContext, isExternalRAGAvailable, getExternalRAGConfig)
// are available via direct import from "./externalRagApi" or Nuxt's auto-import system.
// They are NOT re-exported from this file to avoid duplicate export errors.

// ============================================
// RAG Utility Functions
// ============================================

// RAG Source identifiers
export type RAGSource = 'local' | 'external' | 'combined';

export interface RAGContextResult {
  context: string;
  source: RAGSource;
  localContext?: string;
  externalContext?: string;
}

/**
 * Formats RAG search results into context text with citations and quality indicators
 */
function formatRAGContext(
  results: Array<{ document: any; similarity: number }>,
  qualityInfo?: {
    thresholdUsed: number;
    qualityLevel: 'high' | 'medium' | 'low' | 'very_low';
    averageSimilarity: number;
  }
): string {
  if (results.length === 0) {
    return "";
  }

  // Build quality indicator header
  let qualityHeader = "";
  if (qualityInfo) {
    const qualityLabels = {
      high: "High Quality",
      medium: "Medium Quality",
      low: "Lower Quality",
      very_low: "Low Quality (permissive match)"
    };
    qualityHeader = `[RAG Quality: ${qualityLabels[qualityInfo.qualityLevel]}, Threshold: ${qualityInfo.thresholdUsed.toFixed(2)}, Avg Similarity: ${qualityInfo.averageSimilarity.toFixed(3)}]\n\n`;
  }

  const formattedChunks = results.map((result, index) => {
    const { document, similarity } = result;
    const content = document.content || "";
    
    // Build source information
    const sourceParts: string[] = [];
    if (document.metadata?.bookTitle) {
      sourceParts.push(`Book: ${document.metadata.bookTitle}`);
    }
    if (document.metadata?.citation && document.metadata.citation !== "Unknown") {
      sourceParts.push(document.metadata.citation);
    }
    
    // Include similarity score in source info for quality assessment
    sourceParts.push(`Similarity: ${similarity.toFixed(3)}`);
    
    // Format: [Source info] Content
    const sourceInfo = sourceParts.length > 0 ? `[${sourceParts.join(" | ")}]` : "";
    const formattedContent = sourceInfo ? `${sourceInfo}\n${content}` : content;
    
    return formattedContent;
  });

  return qualityHeader + formattedChunks.join("\n\n---\n\n");
}

/**
 * Fetches RAG context from the local vector store using exhaustive multi-query search strategy
 * 
 * This function implements a zero-miss strategy:
 * 1. Tries LLM-rewritten queries (if enabled)
 * 2. Tries cleaned query
 * 3. Tries original query
 * 4. Tries keyword-only query
 * 
 * For each query variation, uses progressive threshold fallback (0.7 -> 0.5 -> 0.3 -> 0.1)
 * Only returns empty after exhausting ALL strategies.
 * 
 * @param searchQuery - The search query to find relevant context
 * @param authToken - Optional (kept for compatibility, not used with local store)
 * @param context - Optional context (subject, level, topic) for query enhancement
 * @returns Promise<string> - The formatted context text with citations and quality indicators, or empty string if no context found after exhaustive search
 */
export async function fetchRAGContext(
  searchQuery: string,
  authToken?: string,
  context?: QueryContext
): Promise<string> {
  if (!searchQuery?.trim()) {
    console.log("[RAG] Empty search query, skipping RAG");
    return "";
  }

  const originalQuery = searchQuery.trim();
  console.log(`[RAG] Starting exhaustive search for: "${originalQuery.substring(0, 100)}"`);

  try {
    // Step 1: Process query with LLM rewriting (if enabled) or rule-based processing
    let processedQuery: {
      original: string;
      cleaned: string;
      expanded: string;
      type: string;
      keywords: string[];
      subject?: string;
      llmRewritten?: string[];
    } | null = null;

    if (isQueryExpansionEnabled()) {
      try {
        // Try LLM-based processing first (if enabled)
        const useLLM = process.env.ENABLE_LLM_QUERY_REWRITE !== 'false';
        if (useLLM) {
          processedQuery = await processQueryWithLLM(originalQuery, context, true);
        } else {
          processedQuery = processQuery(originalQuery, context);
        }

        console.log("[RAG] Query processing:");
        console.log(`  Original: "${processedQuery.original}"`);
        console.log(`  Cleaned: "${processedQuery.cleaned}"`);
        console.log(`  Type: ${processedQuery.type}`);
        console.log(`  Keywords: [${processedQuery.keywords.join(", ")}]`);
        if (processedQuery.subject) {
          console.log(`  Detected subject: ${processedQuery.subject}`);
        }
        if (processedQuery.llmRewritten) {
          console.log(`  LLM Rewritten: [${processedQuery.llmRewritten.join(", ")}]`);
        }
      } catch (error: any) {
        console.warn("[RAG] Query processing failed, using original query:", error?.message || error);
        processedQuery = null;
      }
    } else {
      console.log("[RAG] Query expansion disabled, using original query");
    }

    // Step 2: Build query variations to try (in order of preference)
    const queryVariations: string[] = [];
    
    // Add LLM-rewritten queries first (if available)
    if (processedQuery?.llmRewritten && processedQuery.llmRewritten.length > 0) {
      queryVariations.push(...processedQuery.llmRewritten);
    }
    
    // Add cleaned query (expansion removed for now)
    if (processedQuery?.cleaned) {
      queryVariations.push(processedQuery.cleaned);
    }
    
    // Add original query
    queryVariations.push(originalQuery);
    
    // Add keyword-only query (if we have keywords)
    if (processedQuery?.keywords && processedQuery.keywords.length > 0) {
      queryVariations.push(processedQuery.keywords.join(' '));
    }

    // Remove duplicates while preserving order
    const uniqueVariations: string[] = [];
    const seenLower = new Set<string>();
    for (const q of queryVariations) {
      const lower = q.trim().toLowerCase();
      if (lower && !seenLower.has(lower)) {
        seenLower.add(lower);
        uniqueVariations.push(q.trim());
      }
    }

    // Limit to max variations (default: 5)
    const maxVariations = parseInt(process.env.MAX_QUERY_VARIATIONS || '5', 10);
    const finalVariations: string[] = uniqueVariations.slice(0, maxVariations);

    console.log(`[RAG] Generated ${finalVariations.length} query variations to try:`);
    finalVariations.forEach((q, i) => {
      console.log(`  ${i + 1}. "${q.substring(0, 80)}${q.length > 80 ? '...' : ''}"`);
    });

    // Step 3: Try each query variation with progressive threshold fallback
    let bestResults: Array<{ document: any; similarity: number }> = [];
    let bestQualityInfo: {
      thresholdUsed: number;
      qualityLevel: 'high' | 'medium' | 'low' | 'very_low';
      averageSimilarity: number;
    } | undefined;
    let bestQuery = "";

    for (let i = 0; i < finalVariations.length; i++) {
      const queryVariation = finalVariations[i];
      if (!queryVariation) continue; // TypeScript guard
      
      console.log(`[RAG] Trying query variation ${i + 1}/${finalVariations.length}: "${queryVariation.substring(0, 80)}${queryVariation.length > 80 ? '...' : ''}"`);

      try {
        // Use progressive threshold fallback
        const searchResult = await searchWithProgressiveThreshold(queryVariation, {
          limit: 5, // Top 5 most relevant chunks
          initialThreshold: 0.7, // Start with high threshold
        });

        if (searchResult.results.length > 0) {
          console.log(`[RAG] ✅ Found ${searchResult.results.length} results with query variation ${i + 1} (quality: ${searchResult.qualityLevel}, threshold: ${searchResult.thresholdUsed.toFixed(2)})`);
          
          // If this is the first result or better quality than previous, use it
          if (bestResults.length === 0 || searchResult.qualityLevel === 'high' || 
              (searchResult.averageSimilarity > (bestQualityInfo?.averageSimilarity || 0))) {
            bestResults = searchResult.results;
            bestQualityInfo = {
              thresholdUsed: searchResult.thresholdUsed,
              qualityLevel: searchResult.qualityLevel,
              averageSimilarity: searchResult.averageSimilarity,
            };
            bestQuery = queryVariation;
            
            // If we got high quality results, we can stop early
            if (searchResult.qualityLevel === 'high' && searchResult.thresholdUsed >= 0.7) {
              console.log(`[RAG] High quality results found, stopping search early`);
              break;
            }
          }
        } else {
          console.log(`[RAG] No results found with query variation ${i + 1}, trying next...`);
        }
      } catch (error: any) {
        console.warn(`[RAG] Error searching with query variation ${i + 1}:`, error?.message || error);
        // Continue to next variation
      }
    }

    // Step 4: Format and return results
    if (bestResults.length > 0) {
      console.log(`[RAG] ✅ Exhaustive search completed: Found ${bestResults.length} results using query: "${bestQuery.substring(0, 80)}${bestQuery.length > 80 ? '...' : ''}"`);
      console.log(`[RAG] Quality: ${bestQualityInfo?.qualityLevel}, Threshold: ${bestQualityInfo?.thresholdUsed.toFixed(2)}, Avg Similarity: ${bestQualityInfo?.averageSimilarity.toFixed(3)}`);

      // Format results with citations and quality indicators
      const contextText = formatRAGContext(bestResults, bestQualityInfo);

      if (contextText.trim()) {
        console.log(`[RAG] Generated context text (${contextText.length} characters)`);
        console.log("[RAG] Context preview (first 300 chars):", contextText.substring(0, 300));
        return contextText.trim();
      }
    } else {
      console.log(`[RAG] ❌ Exhaustive search completed: No results found after trying ${finalVariations.length} query variations with progressive threshold fallback`);
      console.log(`[RAG] This indicates the information may not be in the uploaded books, or the query needs significant rephrasing`);
    }

    return "";
  } catch (error: any) {
    console.error("[RAG] Failed during exhaustive search:", error?.message || error);
    console.error("[RAG] Stack:", error?.stack);
    // Return empty string on error to allow chat to continue without RAG context
    return "";
  }
}

// Alias for clarity - this is the LOCAL vector store search
export const fetchLocalRAGContext = fetchRAGContext;

/**
 * Fetches RAG context from BOTH local vector store AND external API
 * Combines results from both sources for comprehensive coverage
 * 
 * @param searchQuery - The search query
 * @param authToken - Optional authentication token for external API
 * @param context - Optional context for query enhancement
 * @param options - Options for controlling which sources to use
 * @returns Combined context with source information
 */
export async function fetchCombinedRAGContext(
  searchQuery: string,
  authToken?: string,
  context?: QueryContext,
  options: {
    useLocal?: boolean;
    useExternal?: boolean;
    preferExternal?: boolean; // If true, external results shown first
  } = {}
): Promise<RAGContextResult> {
  const { useLocal = true, useExternal = true, preferExternal = false } = options;

  if (!searchQuery?.trim()) {
    console.log("[Combined RAG] Empty search query, skipping");
    return { context: "", source: 'combined' };
  }

  const query = searchQuery.trim();
  console.log(`[Combined RAG] Starting combined search for: "${query.substring(0, 100)}"`);
  console.log(`[Combined RAG] Sources: local=${useLocal}, external=${useExternal}, preferExternal=${preferExternal}`);

  let localContext = "";
  let externalContext = "";

  // Fetch from both sources in parallel
  const promises: Promise<string>[] = [];
  
  if (useLocal) {
    promises.push(
      fetchRAGContext(query, authToken, context)
        .then(result => {
          localContext = result;
          return result;
        })
        .catch(error => {
          console.error("[Combined RAG] Local search failed:", error?.message);
          return "";
        })
    );
  }

  if (useExternal) {
    promises.push(
      fetchExternalRAG(query, authToken)
        .then(result => {
          externalContext = result;
          return result;
        })
        .catch(error => {
          console.error("[Combined RAG] External search failed:", error?.message);
          return "";
        })
    );
  }

  // Wait for both to complete
  await Promise.all(promises);

  // Determine source and combine results
  let combinedContext = "";
  let source: RAGSource = 'combined';

  if (localContext && externalContext) {
    // Both sources have results
    source = 'combined';
    if (preferExternal) {
      combinedContext = `=== EXTERNAL RAG CONTEXT (API) ===\n${externalContext}\n\n=== LOCAL RAG CONTEXT (Vector Store) ===\n${localContext}`;
    } else {
      combinedContext = `=== LOCAL RAG CONTEXT (Vector Store) ===\n${localContext}\n\n=== EXTERNAL RAG CONTEXT (API) ===\n${externalContext}`;
    }
    console.log(`[Combined RAG] Both sources returned results`);
  } else if (localContext) {
    // Only local has results
    source = 'local';
    combinedContext = `=== LOCAL RAG CONTEXT (Vector Store) ===\n${localContext}`;
    console.log(`[Combined RAG] Only local source returned results`);
  } else if (externalContext) {
    // Only external has results
    source = 'external';
    combinedContext = `=== EXTERNAL RAG CONTEXT (API) ===\n${externalContext}`;
    console.log(`[Combined RAG] Only external source returned results`);
  } else {
    // No results from either
    console.log(`[Combined RAG] No results from any source`);
  }

  return {
    context: combinedContext.trim(),
    source,
    localContext: localContext || undefined,
    externalContext: externalContext || undefined,
  };
}
