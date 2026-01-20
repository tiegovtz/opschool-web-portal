import { getBookById, getDocumentsByBookId, deleteByBookId } from "../../utils/vectorStore";

/**
 * GET /api/books/[bookId] - Get book details
 * DELETE /api/books/[bookId] - Delete book
 */
export default defineEventHandler(async (event) => {
  const bookId = getRouterParams(event).bookId;

  if (!bookId) {
    throw createError({
      statusCode: 400,
      message: "bookId is required",
    });
  }

  if (event.method === "GET") {
    try {
      const book = await getBookById(bookId);

      if (!book) {
        throw createError({
          statusCode: 404,
          message: `Book with id ${bookId} not found`,
        });
      }

      // Optionally get all documents for this book
      const documents = await getDocumentsByBookId(bookId);

      return {
        success: true,
        book: {
          ...book,
          documents: documents.map((doc) => ({
            id: doc.id,
            content: doc.content.substring(0, 200) + "...", // Preview only
            citation: doc.metadata.citation,
            chunkIndex: doc.metadata.chunkIndex,
          })),
        },
      };
    } catch (error: any) {
      console.error("[Books API] Error getting book:", error);
      
      if (error.statusCode) {
        throw error;
      }
      
      throw createError({
        statusCode: 500,
        message: `Failed to get book: ${error.message || "Unknown error"}`,
      });
    }
  }

  if (event.method === "DELETE") {
    try {
      const deletedCount = await deleteByBookId(bookId);

      if (deletedCount === 0) {
        throw createError({
          statusCode: 404,
          message: `Book with id ${bookId} not found or already deleted`,
        });
      }

      return {
        success: true,
        message: `Deleted ${deletedCount} chunks for book ${bookId}`,
        deletedCount,
        bookId,
      };
    } catch (error: any) {
      console.error("[Books API] Error deleting book:", error);
      
      if (error.statusCode) {
        throw error;
      }
      
      throw createError({
        statusCode: 500,
        message: `Failed to delete book: ${error.message || "Unknown error"}`,
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: "Method not allowed. Use GET or DELETE.",
  });
});

