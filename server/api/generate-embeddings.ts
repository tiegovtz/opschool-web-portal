import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { embedQuery } from "./utils/embeddings";

/**
 * API endpoint to generate embeddings for all image shortcodes
 * This should be called manually via a button, not automatically
 */
export default defineEventHandler(async (event) => {
  try {
    const filePath = join(process.cwd(), 'server', 'data', 'image-shortcodes.json');
    
    // Read existing shortcodes
    let fileContent: string;
    try {
      fileContent = await readFile(filePath, 'utf-8');
    } catch (error: any) {
      return {
        success: false,
        error: "Image shortcodes file not found. Please access /image-list first to generate shortcodes.",
      };
    }

    const data = JSON.parse(fileContent);
    
    if (!data.shortcodes || Object.keys(data.shortcodes).length === 0) {
      return {
        success: false,
        error: "No shortcodes found. Please access /image-list first to generate shortcodes.",
      };
    }

    const shortcodes = data.shortcodes;
    const total = Object.keys(shortcodes).length;
    let embeddingCount = 0;
    let embeddingErrors = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Count how many already have embeddings
    for (const [_, metadata] of Object.entries(shortcodes)) {
      const meta = metadata as any;
      if (meta.embedding && Array.isArray(meta.embedding) && meta.embedding.length > 0) {
        skippedCount++;
      }
    }

    const needsEmbedding = total - skippedCount;
    console.log(`[generate-embeddings] Starting embedding generation: ${needsEmbedding} need embeddings, ${skippedCount} already have embeddings (will be skipped)`);

    if (needsEmbedding === 0) {
      console.log(`[generate-embeddings] ✅ All images already have embeddings. Nothing to generate.`);
      return {
        success: true,
        total: total,
        generated: 0,
        skipped: skippedCount,
        errors: 0,
        message: `All ${total} images already have embeddings. No new embeddings generated.`,
      };
    }

    let processedCount = 0;

    // Generate embeddings for each shortcode
    for (const [shortcode, metadata] of Object.entries(shortcodes)) {
      const meta = metadata as any;
      
      // Skip if already has embedding (preserve existing embeddings)
      if (meta.embedding && Array.isArray(meta.embedding) && meta.embedding.length > 0) {
        continue; // Skip - already has embedding
      }

      processedCount++;

      // Use searchableText if available, otherwise create it
      const searchableText = meta.searchableText || [
        shortcode,
        meta.alt || '',
        meta.description || '',
        meta.chapterName || '',
        meta.topicName || ''
      ].filter(Boolean).join(' ');

      try {
        const embedding = await embedQuery(searchableText);
        meta.embedding = embedding;
        embeddingCount++;
        
        if (embeddingCount % 10 === 0 || embeddingCount === needsEmbedding) {
          console.log(`[generate-embeddings] Progress: ${embeddingCount}/${needsEmbedding} new embeddings generated (${skippedCount} skipped, ${embeddingErrors} errors)`);
        }
      } catch (error: any) {
        embeddingErrors++;
        const errorMsg = `Failed for ${shortcode}: ${error.message}`;
        errors.push(errorMsg);
        console.warn(`[generate-embeddings] ${errorMsg}`);
        // Continue without embedding
      }
    }

    // Save updated data with embeddings
    data.generatedAt = new Date().toISOString();
    data.embeddingsGeneratedAt = new Date().toISOString();
    data.embeddingsCount = embeddingCount;
    data.embeddingsErrors = embeddingErrors;

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`[generate-embeddings] ✅ Completed: Generated ${embeddingCount} new embeddings, skipped ${skippedCount} existing embeddings (${embeddingErrors} errors)`);

    let message = '';
    if (embeddingCount === 0 && skippedCount === total) {
      message = `All ${total} images already have embeddings. No new embeddings generated.`;
    } else if (embeddingCount > 0) {
      message = `Successfully generated ${embeddingCount} new embedding${embeddingCount === 1 ? '' : 's'}. ${skippedCount > 0 ? `${skippedCount} already had embeddings (skipped). ` : ''}${embeddingErrors > 0 ? `${embeddingErrors} failed.` : ''}`;
    } else {
      message = `No new embeddings generated. ${embeddingErrors > 0 ? `${embeddingErrors} failed.` : ''}`;
    }

    return {
      success: true,
      total: total,
      generated: embeddingCount,
      skipped: skippedCount,
      errors: embeddingErrors,
      errorMessages: errors.slice(0, 10), // Return first 10 errors
      message: message,
    };
  } catch (error: any) {
    console.error('[generate-embeddings] Error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
});

