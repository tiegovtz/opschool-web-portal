// LOCAL RAG DISABLED - Commented out local RAG imports
// import { searchWithProgressiveThreshold } from "./vectorStore";
// import { 
//   processQuery, 
//   processQueryWithLLM,
//   isQueryExpansionEnabled, 
//   type QueryContext 
// } from "./queryProcessor";
import { _fetchExternalRAGContext as fetchExternalRAG } from "./externalRagApi";

// Type definition for QueryContext (needed for function signature)
type QueryContext = {
  subject?: string;
  level?: string;
  topic?: string;
};

export type RAGSource = 'local' | 'external' | 'combined';

export interface RAGContextResult {
  context: string;
  source: RAGSource;
  externalContext?: string;
}

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

  const formattedChunks = results.map((result) => {
    const { document, similarity } = result;
    const content = document.content || "";
    
    const sourceParts: string[] = [];
    if (document.metadata?.bookTitle) {
      sourceParts.push(`Book: ${document.metadata.bookTitle}`);
    }
    if (document.metadata?.citation && document.metadata.citation !== "Unknown") {
      sourceParts.push(document.metadata.citation);
    }
    sourceParts.push(`Similarity: ${similarity.toFixed(3)}`);
    
    const sourceInfo = sourceParts.length > 0 ? `[${sourceParts.join(" | ")}]` : "";
    return sourceInfo ? `${sourceInfo}\n${content}` : content;
  });

  return qualityHeader + formattedChunks.join("\n\n---\n\n");
}

// LOCAL RAG DISABLED - Using external RAG only
// export async function fetchRAGContext(
//   searchQuery: string,
//   authToken?: string,
//   context?: QueryContext
// ): Promise<string> {
//   if (!searchQuery?.trim()) {
//     return "";
//   }

//   const originalQuery = searchQuery.trim();

//   try {
//     let processedQuery: {
//       original: string;
//       cleaned: string;
//       expanded: string;
//       type: string;
//       keywords: string[];
//       subject?: string;
//       llmRewritten?: string[];
//     } | null = null;

//     if (isQueryExpansionEnabled()) {
//       try {
//         const useLLM = process.env.ENABLE_LLM_QUERY_REWRITE !== 'false';
//         if (useLLM) {
//           processedQuery = await processQueryWithLLM(originalQuery, context, true);
//         } else {
//           processedQuery = processQuery(originalQuery, context);
//         }
//       } catch {
//         processedQuery = null;
//       }
//     }

//     const queryVariations: string[] = [];
    
//     if (processedQuery?.llmRewritten && processedQuery.llmRewritten.length > 0) {
//       queryVariations.push(...processedQuery.llmRewritten);
//     }
    
//     if (processedQuery?.cleaned) {
//       queryVariations.push(processedQuery.cleaned);
//     }
    
//     queryVariations.push(originalQuery);
    
//     if (processedQuery?.keywords && processedQuery.keywords.length > 0) {
//       queryVariations.push(processedQuery.keywords.join(' '));
//     }

//     const uniqueVariations: string[] = [];
//     const seenLower = new Set<string>();
//     for (const q of queryVariations) {
//       const lower = q.trim().toLowerCase();
//       if (lower && !seenLower.has(lower)) {
//         seenLower.add(lower);
//         uniqueVariations.push(q.trim());
//       }
//     }

//     const maxVariations = parseInt(process.env.MAX_QUERY_VARIATIONS || '5', 10);
//     const finalVariations: string[] = uniqueVariations.slice(0, maxVariations);

//     let bestResults: Array<{ document: any; similarity: number }> = [];
//     let bestQualityInfo: {
//       thresholdUsed: number;
//       qualityLevel: 'high' | 'medium' | 'low' | 'very_low';
//       averageSimilarity: number;
//     } | undefined;

//     for (let i = 0; i < finalVariations.length; i++) {
//       const queryVariation = finalVariations[i];
//       if (!queryVariation) continue;

//       try {
//         const searchResult = await searchWithProgressiveThreshold(queryVariation, {
//           limit: 5,
//           initialThreshold: 0.7,
//         });

//         if (searchResult.results.length > 0) {
//           if (bestResults.length === 0 || searchResult.qualityLevel === 'high' || 
//               (searchResult.averageSimilarity > (bestQualityInfo?.averageSimilarity || 0))) {
//             bestResults = searchResult.results;
//             bestQualityInfo = {
//               thresholdUsed: searchResult.thresholdUsed,
//               qualityLevel: searchResult.qualityLevel,
//               averageSimilarity: searchResult.averageSimilarity,
//             };
            
//             if (searchResult.qualityLevel === 'high' && searchResult.thresholdUsed >= 0.7) {
//               break;
//             }
//           }
//         }
//       } catch {
//         // Continue to next variation
//       }
//     }

//     if (bestResults.length > 0) {
//       const contextText = formatRAGContext(bestResults, bestQualityInfo);
//       if (contextText.trim()) {
//         return contextText.trim();
//       }
//     }

//     return "";
//   } catch {
//     return "";
//   }
// }

// export const fetchLocalRAGContext = fetchRAGContext;

// Stub function to prevent errors
export async function fetchRAGContext(
  searchQuery: string,
  authToken?: string,
  context?: QueryContext
): Promise<string> {
  // Local RAG disabled - returning empty string
  return "";
}

export const fetchLocalRAGContext = fetchRAGContext;

export async function fetchCombinedRAGContext(
  searchQuery: string,
  authToken?: string,
  context?: QueryContext,
  options: {
    useLocal?: boolean;
    useExternal?: boolean;
    preferExternal?: boolean;
  } = {}
): Promise<RAGContextResult> {
 try {
   const { useLocal = true, useExternal = true, preferExternal = false } = options;

  if (!searchQuery?.trim()) {
    return { context: "", source: 'combined' };
  }

  const query = searchQuery.trim();

  let externalContext = "";

  const promises: Promise<string>[] = [];
  
  // LOCAL RAG DISABLED
  // if (useLocal) {
  //   promises.push(
  //     fetchRAGContext(query, authToken, context)
  //       .then(result => {
  //         localContext = result;
  //         return result;
  //       })
  //       .catch(() => "")
  //   );
  // }

  if (useExternal) {
    promises.push(
      fetchExternalRAG(query, authToken)
        .then(result => {
          externalContext = result;
          return result;
        })
        .catch((err) => err)
    );
  }

  await Promise.all(promises);

  let combinedContext = "";
  let source: RAGSource = 'external'; // Default to external since local is disabled

  // LOCAL RAG DISABLED - Only external context
  // if (localContext && externalContext) {
  //   source = 'combined';
  //   if (preferExternal) {
  //     combinedContext = `=== EXTERNAL RAG CONTEXT (API) ===\n${externalContext}\n\n=== LOCAL RAG CONTEXT (Vector Store) ===\n${localContext}`;
  //   } else {
  //     combinedContext = `=== LOCAL RAG CONTEXT (Vector Store) ===\n${localContext}\n\n=== EXTERNAL RAG CONTEXT (API) ===\n${externalContext}`;
  //   }
  // } else if (localContext) {
  //   source = 'local';
  //   combinedContext = `=== LOCAL RAG CONTEXT (Vector Store) ===\n${localContext}`;
  // } else 
  if (externalContext) {
    source = 'external';
    combinedContext = `=== EXTERNAL RAG CONTEXT (API) ===\n${externalContext}`;
  }

  return {
    context: combinedContext.trim(),
    source,
    externalContext: externalContext || undefined,
  };
 } catch (error) {
  console.log("[External API call error in RAG]:",error);
  return { context: "", source: 'combined' };
 }
}
