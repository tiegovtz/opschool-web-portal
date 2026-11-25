import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { H3Event } from 'h3';
import { backendProxyBaseUrl, backendProxyTarget } from '../../shared/backend/proxy';
import { readSessionToken } from './sessionAuth';

/** Stream with backpressure and cancel the upstream when the player disconnects. */
export async function streamMedia(event: H3Event, kind: 'video' | 'audio') {
  const method = getMethod(event);
  if (method !== 'GET' && method !== 'HEAD') throw createError({ statusCode: 405, message: 'Method Not Allowed' });
  const token = readSessionToken(event);
  if (!token) throw createError({ statusCode: 401, message: 'No authorization token provided' });
  const id = getRouterParam(event, `${kind}Id`);
  if (!id) throw createError({ statusCode: 400, message: `No ${kind} ID provided` });

  let target: URL;
  try {
    const base = backendProxyBaseUrl(process.env.NUXT_BACKEND_API_BASE_URL, process.env.VITE_API_BASE_URL, useRuntimeConfig(event).backendApiBaseUrl);
    target = backendProxyTarget(base, `v1/${kind}-stream/${id}`, '');
  } catch {
    throw createError({ statusCode: 503, message: 'Media backend configuration is invalid' });
  }

  const controller = new AbortController();
  const res = event.node.res;
  const disconnect = () => { if (!res.writableFinished) controller.abort(); };
  res.once('close', disconnect);
  let headersTimedOut = false;
  const timeout = setTimeout(() => { headersTimedOut = true; controller.abort(); }, 20_000);
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Accept-Encoding': 'identity' };
    for (const name of ['range', 'if-range', 'if-none-match', 'if-modified-since']) {
      const value = getHeader(event, name);
      if (value) headers[name] = value;
    }
    const response = await fetch(target, { method, headers, signal: controller.signal });
    clearTimeout(timeout); // Only headers time out; playback can take as long as needed.
    setResponseStatus(event, response.status);
    setHeader(event, 'Cache-Control', 'private, no-store');
    setHeader(event, 'X-Accel-Buffering', 'no');
    for (const name of ['content-type', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
      const value = response.headers.get(name);
      if (value) setHeader(event, name, value);
    }
    // fetch decompresses response bodies; a compressed content-length is invalid.
    const encoding = response.headers.get('content-encoding');
    const length = response.headers.get('content-length');
    if (length && (!encoding || encoding === 'identity')) setHeader(event, 'content-length', Number(length));
    if (method === 'HEAD' || !response.body) {
      await response.body?.cancel();
      res.end();
      return;
    }
    const reader = response.body.getReader();
    const source = Readable.from((async function* () {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    })(), { objectMode: false });
    await pipeline(source, res);
  } catch (error) {
    if (res.destroyed || res.headersSent) {
      if (!res.destroyed) res.destroy(error instanceof Error ? error : undefined);
      return;
    }
    throw createError({ statusCode: headersTimedOut ? 504 : 502, message: headersTimedOut ? 'Media backend did not respond in time' : 'Media streaming failed', cause: error });
  } finally {
    clearTimeout(timeout);
    controller.abort();
    res.off('close', disconnect);
  }
}
