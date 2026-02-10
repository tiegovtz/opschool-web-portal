/**
 * Machine Learning Books API Client
 *
 * Calls the external ML API (same base URL as app: VITE_API_BASE_URL, ends with /v1).
 * Paths are relative without /v1: e.g. machine-learning/books, machine-learning/books/{id}.
 * Authorization: pass access token from cookies (signInAccessToken) like the rest of the app.
 */

export interface ApiBook {
  _id: string;
  id: string;
  title: string;
  description?: string;
  bookPath?: string;
  classLevel?: string;
  subject?: string;
  createdAt: string;
}

export interface ApiChunk {
  _id?: string;
  id?: string;
  content: string;
  embedding: number[];
  citation?: string;
  source?: string;
  tokenEstimate?: number;
  paragraphCount?: number;
  hasOverlap?: boolean;
  matchPercentage?: number;
}

/** App-facing book shape (matches vectorStore BookInfo) */
export interface BookInfo {
  id: string;
  title: string;
  uploadedAt: string;
  chunkCount: number;
  totalPages?: number;
  totalTokens: number;
}

/** App-facing document shape (matches vectorStore VectorDocument metadata preview) */
export interface DocumentPreview {
  id: string;
  content: string;
  citation: string;
  chunkIndex: number;
}

/** Base URL for ML API; strips surrounding quotes and trailing slash so .env values like "https://..." work. */
function getBaseUrl(): string {
  const raw = process.env.VITE_API_BASE_URL ?? "";
  const url = raw.trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
  return url || "";
}

/** Request timeout in ms (60s) – listing books + chunks can be slow on the ML API */
const REQUEST_TIMEOUT_MS = 60_000;

function getAuthHeaders(accessToken: string): Record<string, string> {
  const token = (accessToken ?? "").trim().replace(/^["']|["']$/g, "");
  if (!token) throw new Error("Access token is required");
  return { Authorization: `Bearer ${token}` };
}

function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const signal = controller.signal;
  (signal as { _clear?: () => void })._clear = () => clearTimeout(timer);
  return signal;
}

const LOG_TAG = "[ML Books API]";

function logError(context: {
  method: string;
  pathOrUrl: string;
  status?: number;
  responseBody?: string;
  message: string;
  err?: unknown;
}): void {
  console.error(`${LOG_TAG} ERROR`, {
    method: context.method,
    pathOrUrl: context.pathOrUrl,
    status: context.status,
    responseBody: context.responseBody != null ? (context.responseBody.length > 500 ? context.responseBody.slice(0, 500) + "…" : context.responseBody) : undefined,
    message: context.message,
    errorName: context.err instanceof Error ? context.err.name : undefined,
    errorMessage: context.err instanceof Error ? context.err.message : undefined,
    stack: context.err instanceof Error ? context.err.stack : undefined,
  });
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; query?: Record<string, string>; accessToken: string }
): Promise<T> {
  const base = getBaseUrl();
  if (!base) throw new Error("VITE_API_BASE_URL is not set");
  const pathWithSlash = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${pathWithSlash}`;
  const headers: Record<string, string> = { ...getAuthHeaders(options.accessToken) };
  let fullUrl = url;
  if (options.query && Object.keys(options.query).length > 0) {
    const search = new URLSearchParams(options.query).toString();
    fullUrl = `${url}${url.includes("?") ? "&" : "?"}${search}`;
  }
  const timeoutSignal = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  const init: RequestInit = { method, headers, signal: timeoutSignal };
  if (options.body !== undefined && options.body !== null) {
    if (options.body instanceof FormData) {
      delete (headers as Record<string, unknown>)["Content-Type"];
      init.body = options.body;
    } else {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(options.body);
    }
  }
  let response: Response;
  try {
    response = await fetch(fullUrl, init);
  } catch (err: unknown) {
    const timeoutMsg = `request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`;
    const isAbort =
      (err instanceof Error && err.name === "AbortError") ||
      (err instanceof Error && err.message === "This operation was aborted");
    if (isAbort) {
      logError({ method, pathOrUrl: fullUrl, message: timeoutMsg, err });
      throw new Error(`ML Books API ${method} ${path}: ${timeoutMsg}`);
    }
    logError({ method, pathOrUrl: fullUrl, message: err instanceof Error ? err.message : "Network or request failed", err });
    throw err;
  }
  if (!response.ok) {
    const text = await response.text();
    let message: string;
    try {
      const data = JSON.parse(text);
      message = data.message || data.error || text || response.statusText;
    } catch {
      message = text || response.statusText;
    }
    logError({ method, pathOrUrl: fullUrl, status: response.status, responseBody: text, message: `HTTP ${response.status}: ${message}` });
    throw new Error(`ML Books API ${method} ${path}: ${response.status} ${message}`);
  }
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  return undefined as T;
}

function mapApiBookToBookInfo(api: ApiBook, chunkCount = 0, totalTokens = 0): BookInfo {
  return {
    id: api.id || api._id,
    title: api.title,
    uploadedAt: api.createdAt,
    chunkCount,
    totalTokens,
  };
}

/**
 * List all books (optional filters: classLevel, subject). Access token from cookies (signInAccessToken) is required.
 */
export async function listMLBooks(
  query: { classLevel?: string; subject?: string } | undefined,
  accessToken: string
): Promise<BookInfo[]> {
  if (!accessToken?.trim()) throw new Error("Access token is required");
  const base = getBaseUrl();
  if (!base) throw new Error("VITE_API_BASE_URL is not set");
  const q: Record<string, string> = {};
  if (query?.classLevel) q.classLevel = query.classLevel;
  if (query?.subject) q.subject = query.subject;
  const rawBooks = await request<ApiBook[] | { data?: ApiBook[]; books?: ApiBook[] }>("GET", "machine-learning/books", {
    query: Object.keys(q).length ? q : undefined,
    accessToken,
  });
  const books = Array.isArray(rawBooks)
    ? rawBooks
    : Array.isArray((rawBooks as { data?: ApiBook[] })?.data)
      ? (rawBooks as { data: ApiBook[] }).data
      : Array.isArray((rawBooks as { books?: ApiBook[] })?.books)
        ? (rawBooks as { books: ApiBook[] }).books
        : [];
  const chunks = await listChunks(accessToken);
  const bySource: Record<string, { count: number; tokens: number }> = {};
  for (const c of chunks) {
    const src = c.source || "";
    if (!bySource[src]) bySource[src] = { count: 0, tokens: 0 };
    bySource[src].count += 1;
    bySource[src].tokens += c.tokenEstimate || 0;
  }
  return books.map((b) => {
    const id = b.id || b._id;
    const stats = bySource[id] || bySource[b.title] || { count: 0, tokens: 0 };
    return mapApiBookToBookInfo(b, stats.count, stats.tokens);
  });
}

/**
 * Get a single book by id
 */
export async function getMLBookById(bookId: string, accessToken: string): Promise<BookInfo | null> {
  try {
    const api = await request<ApiBook>("GET", `machine-learning/books/${encodeURIComponent(bookId)}`, {
      accessToken,
    });
    if (!api) return null;
    const chunks = await listChunks(accessToken);
    const bookChunks = chunks.filter((c) => c.source === bookId || c.source === api.title);
    const chunkCount = bookChunks.length;
    const totalTokens = bookChunks.reduce((s, c) => s + (c.tokenEstimate || 0), 0);
    return mapApiBookToBookInfo(api, chunkCount, totalTokens);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("404")) return null;
    throw e;
  }
}

/**
 * Create a book (multipart: title, description, file, classLevel, subject)
 */
export async function createBook(formData: FormData, accessToken: string): Promise<ApiBook> {
  const base = getBaseUrl();
  if (!base) throw new Error("VITE_API_BASE_URL is not set");
  const url = `${base}/machine-learning/books`;
  const headers = getAuthHeaders(accessToken);
  const signal = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      signal,
    });
  } catch (err: unknown) {
    const isAbort =
      (err instanceof Error && err.name === "AbortError") ||
      (err instanceof Error && err.message === "This operation was aborted");
    if (isAbort) {
      logError({ method: "POST", pathOrUrl: url, message: `request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`, err });
      throw new Error(`ML Books API POST machine-learning/books: request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    logError({ method: "POST", pathOrUrl: url, message: err instanceof Error ? err.message : "Request failed", err });
    throw err;
  }
  if (!response.ok) {
    const text = await response.text();
    let message: string;
    try {
      const data = JSON.parse(text);
      message = data.message || data.error || text || response.statusText;
    } catch {
      message = text || response.statusText;
    }
    logError({ method: "POST", pathOrUrl: url, status: response.status, responseBody: text, message: `HTTP ${response.status}: ${message}` });
    throw new Error(`ML Books API POST machine-learning/books: ${response.status} ${message}`);
  }
  return response.json() as Promise<ApiBook>;
}

/**
 * Update a book
 */
export async function updateBook(
  bookId: string,
  body: {
    title?: string;
    description?: string;
    vectorEmbeddings?: unknown[];
    filepath?: string;
    classLevel?: string;
    subject?: string;
  },
  accessToken: string
): Promise<ApiBook> {
  return request<ApiBook>("PATCH", `machine-learning/books/${encodeURIComponent(bookId)}`, {
    body,
    accessToken,
  });
}

/**
 * Delete a book (delete its chunks first, then the book). Returns number of chunks deleted.
 */
export async function deleteBook(bookId: string, accessToken: string): Promise<number> {
  const chunks = await listChunks(accessToken);
  const bookChunks = chunks.filter((c) => c.source === bookId);
  let deleted = 0;
  for (const c of bookChunks) {
    const id = (c as ApiChunk & { id?: string; _id?: string }).id ?? (c as ApiChunk & { _id?: string })._id;
    if (id) {
      try {
        await request("DELETE", `machine-learning/books/chunks/${encodeURIComponent(id)}`, {
          accessToken,
        });
        deleted += 1;
      } catch {
        // ignore per-chunk errors
      }
    }
  }
  await request("DELETE", `machine-learning/books/${encodeURIComponent(bookId)}`, {
    accessToken,
  });
  return deleted;
}

/**
 * List all chunks
 */
export async function listChunks(accessToken: string): Promise<ApiChunk[]> {
  const result = await request<ApiChunk[] | { data?: ApiChunk[]; chunks?: ApiChunk[] }>("GET", "machine-learning/books/chunks", {
    accessToken,
  });
  if (Array.isArray(result)) return result;
  const data = (result as { data?: ApiChunk[] })?.data;
  const chunks = (result as { chunks?: ApiChunk[] })?.chunks;
  return Array.isArray(data) ? data : Array.isArray(chunks) ? chunks : [];
}

/**
 * Create a chunk
 */
export async function createChunk(
  body: {
    content: string;
    embedding: number[];
    citation: string;
    source: string;
    tokenEstimate: number;
    paragraphCount?: number;
    hasOverlap?: boolean;
  },
  accessToken: string
): Promise<ApiChunk & { id?: string; _id?: string }> {
  const result = await request<ApiChunk & { id?: string; _id?: string }>(
    "POST",
    "machine-learning/books/chunks",
    { body, accessToken }
  );
  return result;
}

/**
 * Delete a chunk by id
 */
export async function deleteChunk(chunkId: string, accessToken: string): Promise<void> {
  await request("DELETE", `machine-learning/books/chunks/${encodeURIComponent(chunkId)}`, {
    accessToken,
  });
}

/**
 * Get chunks/documents for a book (by source = bookId or book title)
 */
export async function getChunksByBookId(bookId: string, accessToken: string): Promise<DocumentPreview[]> {
  const chunks = await listChunks(accessToken);
  const book = await getMLBookById(bookId, accessToken);
  const title = book?.title;
  const filtered = chunks.filter(
    (c) => c.source === bookId || (title && c.source === title)
  );
  return filtered.map((c, i) => ({
    id: (c as ApiChunk & { id?: string; _id?: string }).id ?? (c as ApiChunk & { _id?: string })._id ?? `chunk_${i}`,
    content: c.content,
    citation: c.citation ?? "",
    chunkIndex: i,
  }));
}

/**
 * Stats: totalDocuments, totalBooks, byBook (title -> chunk count)
 */
export async function getMLStats(accessToken: string): Promise<{
  totalDocuments: number;
  totalBooks: number;
  byBook: Record<string, number>;
}> {
  const [books, chunks] = await Promise.all([listMLBooks(undefined, accessToken), listChunks(accessToken)]);
  const byBook: Record<string, number> = {};
  for (const c of chunks) {
    const src = c.source || "Unknown";
    byBook[src] = (byBook[src] || 0) + 1;
  }
  return {
    totalDocuments: chunks.length,
    totalBooks: books.length,
    byBook,
  };
}

/**
 * Delete all documents for a book (chunks + book). Returns number of chunks deleted.
 */
export async function deleteMLBookById(bookId: string, accessToken: string): Promise<number> {
  return deleteBook(bookId, accessToken);
}

/** Result shape for search (compatible with vectorStore search) */
export interface SearchResultItem {
  document: {
    id: string;
    content: string;
    embedding: number[];
    metadata: {
      bookId: string;
      bookTitle: string;
      source: string;
      citation: string;
      chunkIndex: number;
      tokenEstimate: number;
      paragraphCount?: number;
      hasOverlap?: boolean;
      uploadedAt: string;
    };
  };
  similarity: number;
}

/**
 * Search embeddings via ML API (GET .../embeddings/search?search=term).
 * Maps matchPercentage to similarity (0–1).
 */
export async function searchEmbeddings(
  query: string,
  options: { limit?: number; threshold?: number; accessToken: string }
): Promise<SearchResultItem[]> {
  const base = getBaseUrl();
  if (!base) throw new Error("VITE_API_BASE_URL is not set");
  const params = new URLSearchParams({ search: query.trim() });
  const url = `${base}/machine-learning/books/embeddings/search?${params.toString()}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(options.accessToken),
  };
  const signal = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, { method: "GET", headers, signal });
  } catch (err: unknown) {
    const isAbort =
      (err instanceof Error && err.name === "AbortError") ||
      (err instanceof Error && err.message === "This operation was aborted");
    if (isAbort) {
      logError({ method: "GET", pathOrUrl: url, message: `request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`, err });
      throw new Error(`ML Books API GET embeddings/search: request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    logError({ method: "GET", pathOrUrl: url, message: err instanceof Error ? err.message : "Request failed", err });
    throw err;
  }
  if (!response.ok) {
    const text = await response.text();
    logError({ method: "GET", pathOrUrl: url, status: response.status, responseBody: text, message: `HTTP ${response.status}: ${text || response.statusText}` });
    throw new Error(`ML Books API GET embeddings/search: ${response.status} ${text || response.statusText}`);
  }
  const data = await response.json();
  const chunks: ApiChunk[] = Array.isArray(data) ? data : [];
  const threshold = options.threshold ?? 0.5;
  const limit = options.limit ?? 10;
  const results: SearchResultItem[] = chunks
    .map((c) => {
      const similarity = (c.matchPercentage ?? 0) / 100;
      return {
        document: {
          id: (c as ApiChunk & { id?: string; _id?: string }).id ?? (c as ApiChunk & { _id?: string })._id ?? "",
          content: c.content,
          embedding: c.embedding ?? [],
          metadata: {
            bookId: c.source ?? "",
            bookTitle: c.source ?? "",
            source: c.source ?? "",
            citation: c.citation ?? "",
            chunkIndex: 0,
            tokenEstimate: c.tokenEstimate ?? 0,
            paragraphCount: c.paragraphCount,
            hasOverlap: c.hasOverlap,
            uploadedAt: new Date().toISOString(),
          },
        },
        similarity,
      };
    })
    .filter((r) => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
  return results;
}
