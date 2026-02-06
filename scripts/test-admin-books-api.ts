/**
 * Thorough test of admin/books API endpoints.
 *
 * Requires the app to be running (e.g. npm run dev). Sends the access token
 * as the signInAccessToken cookie so the server accepts the request.
 *
 * Usage:
 *   npx tsx scripts/test-admin-books-api.ts
 *   BASE_URL=http://localhost:3000 ACCESS_TOKEN=<jwt> npx tsx scripts/test-admin-books-api.ts
 *   npx tsx scripts/test-admin-books-api.ts [path-to-test.pdf]   # optional: test upload
 *
 * Env:
 *   BASE_URL     - API base (default http://localhost:3000)
 *   ACCESS_TOKEN - JWT (signInAccessToken). Defaults to a dev token if not set.
 */

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const ACCESS_TOKEN =
  process.env.ACCESS_TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTJlYjA5NDhiM2Y1YjQzZjdhMGZiODciLCJ1c2VybmFtZSI6ImVyaWMuam9obiIsInR5cGUiOiJTdHVkZW50IiwiaWF0IjoxNzcwMjIwOTQxLCJleHAiOjE3NzAzOTM3NDF9._MgwpTZgvpEjl6Crzptk0ig-XiX5-tD3q5rRvlJ8aWI";

const cookieHeader = `signInAccessToken=${ACCESS_TOKEN}`;

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Cookie: cookieHeader,
    Accept: "application/json",
    ...extra,
  };
}

async function request(
  method: string,
  path: string,
  options: { body?: unknown; formData?: FormData } = {}
): Promise<{ status: number; data: unknown; ok: boolean }> {
  const url = `${BASE_URL}${path}`;
  const init: RequestInit = {
    method,
    headers: headers(),
  };
  if (options.formData) {
    init.body = options.formData;
    delete (init.headers as Record<string, string>)["Content-Type"];
  } else if (options.body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, init);
  let data: unknown = null;
  const ct = res.headers.get("content-type");
  if (ct?.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }
  } else {
    data = await res.text();
  }
  return { status: res.status, data, ok: res.ok };
}

const log = {
  ok: (msg: string) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`),
  fail: (msg: string) => console.log(`  \x1b[31m✗\x1b[0m ${msg}`),
  info: (msg: string) => console.log(`  ${msg}`),
};

async function run(): Promise<void> {
  console.log("\n--- Admin Books API tests ---");
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`Token: ${ACCESS_TOKEN.substring(0, 30)}...\n`);

  let passed = 0;
  let failed = 0;

  // 1. GET /api/books - list books
  console.log("1. GET /api/books (list books)");
  try {
    const r = await request("GET", "/api/books");
    if (!r.ok) {
      log.fail(`Status ${r.status}: ${JSON.stringify(r.data)}`);
      failed++;
    } else {
      const d = r.data as { success?: boolean; books?: unknown[]; stats?: unknown };
      if (d.success === true && Array.isArray(d.books)) {
        log.ok(`Success: ${d.books.length} books, stats: ${JSON.stringify(d.stats)}`);
        passed++;
      } else {
        log.fail(`Unexpected shape: success=${d.success}, books=${Array.isArray(d.books)}`);
        failed++;
      }
    }
  } catch (e) {
    log.fail(String(e));
    failed++;
  }

  // 2. GET /api/books with query params
  console.log("\n2. GET /api/books?classLevel=Form1&subject=Physics (optional filters)");
  try {
    const r = await request("GET", "/api/books?classLevel=Form1&subject=Physics");
    if (!r.ok) {
      log.fail(`Status ${r.status}`);
      failed++;
    } else {
      const d = r.data as { success?: boolean; books?: unknown[] };
      log.ok(`Success: ${(d.books ?? []).length} books`);
      passed++;
    }
  } catch (e) {
    log.fail(String(e));
    failed++;
  }

  // 3. GET /api/books/:id - get one book (use first from list)
  console.log("\n3. GET /api/books/:id (get book by id)");
  try {
    const listRes = await request("GET", "/api/books");
    const listData = listRes.data as { books?: { id: string }[] };
    const books = listData?.books ?? [];
    if (books.length === 0) {
      log.info("No books in store; skipping get-by-id (use a valid id to test)");
    } else {
      const id = books[0].id;
      const r = await request("GET", `/api/books/${encodeURIComponent(id)}`);
      if (!r.ok) {
        log.fail(`Status ${r.status}: ${JSON.stringify(r.data)}`);
        failed++;
      } else {
        const d = r.data as { success?: boolean; book?: unknown };
        if (d.success === true && d.book) {
          log.ok(`Got book: ${(d.book as { title?: string }).title ?? id}`);
          passed++;
        } else {
          log.fail("Response missing success/book");
          failed++;
        }
      }
    }
  } catch (e) {
    log.fail(String(e));
    failed++;
  }

  // 4. GET /api/books/search
  console.log("\n4. GET /api/books/search?q=physics&limit=3&threshold=0.5");
  try {
    const r = await request("GET", "/api/books/search?q=physics&limit=3&threshold=0.5");
    if (!r.ok) {
      log.fail(`Status ${r.status}: ${JSON.stringify(r.data)}`);
      failed++;
    } else {
      const d = r.data as { success?: boolean; resultsCount?: number; results?: unknown[] };
      if (d.success === true && Array.isArray(d.results)) {
        log.ok(`Search OK: ${d.resultsCount ?? d.results.length} results`);
        passed++;
      } else {
        log.fail(`Unexpected shape: ${JSON.stringify(d).slice(0, 120)}`);
        failed++;
      }
    }
  } catch (e) {
    log.fail(String(e));
    failed++;
  }

  // 5. 401 without token
  console.log("\n5. GET /api/books without Cookie (expect 401)");
  try {
    const res = await fetch(`${BASE_URL}/api/books`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (res.status === 401) {
      log.ok("Correctly returned 401 Unauthorized");
      passed++;
    } else {
      log.fail(`Expected 401, got ${res.status}`);
      failed++;
    }
  } catch (e) {
    log.fail(String(e));
    failed++;
  }

  // 6. POST /api/books/upload (optional: if PDF path provided)
  const pdfPath = process.argv[2];
  if (pdfPath) {
    console.log("\n6. POST /api/books/upload (with file)");
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const stat = await fs.stat(pdfPath).catch(() => null);
      if (!stat?.isFile()) {
        log.fail(`File not found or not a file: ${pdfPath}`);
        failed++;
      } else {
        const name = path.basename(pdfPath);
        const buf = await fs.readFile(pdfPath);
        const form = new FormData();
        form.append("file", new Blob([buf], { type: "application/pdf" }), name);
        form.append("classLevel", "Form 1");
        form.append("subject", "Physics");
        const res = await fetch(`${BASE_URL}/api/books/upload`, {
          method: "POST",
          headers: { Cookie: cookieHeader },
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          log.fail(`Status ${res.status}: ${(data as { message?: string }).message ?? JSON.stringify(data)}`);
          failed++;
        } else {
          const d = data as { success?: boolean; bookId?: string; chunksCount?: number };
          log.ok(`Upload OK: bookId=${d.bookId}, chunks=${d.chunksCount}`);
          passed++;
        }
      }
    } catch (e) {
      log.fail(String(e));
      failed++;
    }
  } else {
    console.log("\n6. POST /api/books/upload - skipped (pass a PDF path to test: npx tsx scripts/test-admin-books-api.ts path/to/file.pdf)");
  }

  // Summary
  console.log("\n--- Summary ---");
  console.log(`Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
