import { listBooks, getStats, deleteByBookId } from "../../utils/vectorStore";

/**
 * GET /api/books - List all books
 * DELETE /api/books - Delete a book (requires bookId in query)
 */
export default defineEventHandler(async (event) => {
  if (event.method === "GET") {
    try {
      const books = await listBooks();
      const stats = await getStats();

      return {
        success: true,
        books,
        stats: {
          totalBooks: stats.totalBooks,
          totalDocuments: stats.totalDocuments,
        },
      };
    } catch (error) {
      console.error("[Books API] Error listing books:", error);
      throw createError({
        statusCode: 500,
        message: `Failed to list books: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  if (event.method === "DELETE") {
    try {
      const query = getQuery(event);
      const bookId = query.bookId as string;

      if (!bookId) {
        throw createError({
          statusCode: 400,
          message: "bookId query parameter is required",
        });
      }

      const deletedCount = await deleteByBookId(bookId);

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

