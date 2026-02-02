import { defineEventHandler, getQuery, createError } from "h3";
import { search } from "../../utils/vectorStore";
import { processQuery, isQueryExpansionEnabled, type QueryContext } from "../../utils/queryProcessor";

/**
 * Search endpoint for testing RAG directly
 * GET /api/books/search?q=query&limit=5&threshold=0.7&enhance=true&subject=physics&level=Form 1
 */
export default defineEventHandler(async (event) => {
  if (event.method !== "GET") {
    throw createError({
      statusCode: 405,
      message: "Method not allowed. Use GET.",
    });
  }

  try {
    const query = getQuery(event);
    const searchQuery = (query.q as string) || (query.query as string);
    
    if (!searchQuery || typeof searchQuery !== "string" || searchQuery.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: "Search query is required. Use ?q=your+query",
      });
    }

    const limit = query.limit ? parseInt(query.limit as string) : 5;
    const threshold = query.threshold ? parseFloat(query.threshold as string) : 0.7;
    
    // Optional query enhancement
    const enhance = query.enhance === 'true' || query.enhance === '1' || query.enhance === undefined; // Default to true
    const subject = query.subject as string | undefined;
    const level = query.level as string | undefined;
    const topic = query.topic as string | undefined;

    console.log(`[Book Search] Searching for: "${searchQuery}" (limit: ${limit}, threshold: ${threshold}, enhance: ${enhance})`);

    // Process query if enhancement is enabled
    let processedQuery: { original: string; cleaned: string; expanded: string; type: string; keywords: string[]; subject?: string } | null = null;
    let queryToSearch = searchQuery.trim();
    
    if (enhance && isQueryExpansionEnabled()) {
      try {
        const queryContext: QueryContext | undefined = (subject || level || topic) ? {
          subject,
          level,
          topic,
        } : undefined;
        
        processedQuery = processQuery(searchQuery, queryContext);
        queryToSearch = processedQuery.cleaned; // Use cleaned query instead of expanded
        
        console.log(`[Book Search] Query processing:`);
        console.log(`  Original: "${processedQuery.original}"`);
        console.log(`  Cleaned: "${processedQuery.cleaned}"`);
        console.log(`  Type: ${processedQuery.type}`);
        console.log(`  Keywords: [${processedQuery.keywords.join(", ")}]`);
        if (processedQuery.subject) {
          console.log(`  Detected subject: ${processedQuery.subject}`);
        }
      } catch (error: any) {
        console.warn("[Book Search] Query processing failed, using original query:", error?.message || error);
        // Fall back to original query if processing fails
      }
    } else if (!enhance) {
      console.log("[Book Search] Query enhancement disabled by parameter");
    }

    // Search the vector store using processed/expanded query
    const results = await search(queryToSearch, {
      limit,
      threshold,
    });

    console.log(`[Book Search] Found ${results.length} results`);

    // Format results for display
    const formattedResults = results.map((result) => ({
      similarity: result.similarity,
      content: result.document.content,
      metadata: {
        bookTitle: result.document.metadata?.bookTitle || "Unknown",
        citation: result.document.metadata?.citation || "Unknown",
        bookId: result.document.metadata?.bookId || "Unknown",
        chunkIndex: result.document.metadata?.chunkIndex || "Unknown",
        tokenEstimate: result.document.metadata?.tokenEstimate || 0,
      },
    }));

    return {
      success: true,
      query: searchQuery,
      processedQuery: processedQuery ? {
        cleaned: processedQuery.cleaned,
        type: processedQuery.type,
        keywords: processedQuery.keywords,
        subject: processedQuery.subject,
      } : null,
      resultsCount: results.length,
      limit,
      threshold,
      results: formattedResults,
    };
  } catch (error: any) {
    console.error("[Book Search] Error:", error);
    
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: `Search failed: ${error.message || "Unknown error"}`,
    });
  }
});

