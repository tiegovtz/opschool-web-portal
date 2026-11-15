
import {
  backendProxyBaseUrl,
  backendProxyTarget,
  backendRequestHeaders,
  backendCsrfCookie,
  backendResponseHeaders,
} from '../../../shared/backend/proxy';

const ALLOWED_METHODS = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
];

const REQUEST_TIMEOUT = 60_000;

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const url = getRequestURL(event);

  // --------------------------------------------------
  // Validate HTTP method
  // --------------------------------------------------

  if (!ALLOWED_METHODS.includes(method)) {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed',
    });
  }

  // --------------------------------------------------
  // Validate request origin
  // --------------------------------------------------

  const origin = getHeader(event, 'origin');

  if (origin && origin !== url.origin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Use the portal origin for API requests.',
    });
  }

  // --------------------------------------------------
  // Resolve backend configuration
  // --------------------------------------------------

  const configuredUrl = useRuntimeConfig(event).backendApiBaseUrl;

  let baseUrl: string;

  try {
    baseUrl = backendProxyBaseUrl(
      process.env.NUXT_BACKEND_API_BASE_URL,
      process.env.VITE_API_BASE_URL,
      typeof configuredUrl === 'string'
        ? configuredUrl
        : undefined,
    );
  } catch (error) {
    console.error(
      '[Backend Proxy] Invalid backend configuration:',
      error,
    );

    throw createError({
      statusCode: 503,
      statusMessage: 'Backend API configuration is invalid.',
    });
  }

  // --------------------------------------------------
  // Resolve backend target
  // --------------------------------------------------

  let target: URL;

  try {
    target = backendProxyTarget(
      baseUrl,
      getRouterParam(event, 'path') || '',
      url.search,
    );
  } catch (error) {
    console.error(
      '[Backend Proxy] Invalid request path:',
      error,
    );

    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid backend request path.',
    });
  }

  // --------------------------------------------------
  // Prepare request headers and body
  // --------------------------------------------------

  const headers = backendRequestHeaders(
    new Headers(getRequestHeaders(event) as Record<string, string>),
    getCookie(event, 'signInAccessToken'),
  );

  const rawBody = !['GET', 'HEAD'].includes(method)
    ? await readRawBody(event, false)
    : undefined;

  // --------------------------------------------------
  // Setup request timeout
  // --------------------------------------------------

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort(
      new Error('Backend request timed out after 60 seconds.'),
    );
  }, REQUEST_TIMEOUT);

  let response: Response;
  try {
    // ------------------------------------------------
    // Obtain a token and its matching cookie from the backend for each
    // state-changing request. The proxy does not forward browser cookies.
    // ------------------------------------------------

    if (
      String(useRuntimeConfig(event).csrfEnabled).trim().toLowerCase() !== 'false' &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    ) {
      const csrfUrl = backendProxyTarget(
        baseUrl,
        'v1/auth/csrf-token',
        '',
      );

      let csrfResponse: Response;

      try {
        csrfResponse = await fetch(csrfUrl, {
          headers: {
            accept: 'application/json',
          },
          signal: controller.signal,
        });
      } catch (error) {
        console.error(
          '[Backend Proxy] CSRF connection failed:',
          error,
        );

        throw createError({
          statusCode: 502,
          statusMessage: 'Could not connect to backend CSRF endpoint.',
        });
      }

      if (!csrfResponse.ok) {
        const csrfBody = await csrfResponse.text();

        console.error(
          '[Backend Proxy] CSRF endpoint returned an error:',
          {
            status: csrfResponse.status,
            statusText: csrfResponse.statusText,
            body: csrfBody,
          },
        );

        throw createError({
          statusCode: 502,
          statusMessage: 'Backend CSRF token request failed.',
          data: {
            backendStatus: csrfResponse.status,
            backendStatusText: csrfResponse.statusText,
            backendBody: csrfBody,
          },
        });
      }

      let csrfData: { csrfToken?: unknown };

      try {
        csrfData = await csrfResponse.json();
      } catch (error) {
        console.error(
          '[Backend Proxy] Invalid CSRF response:',
          error,
        );

        throw createError({
          statusCode: 502,
          statusMessage: 'Backend returned an invalid CSRF response.',
        });
      }

      const csrfToken = csrfData.csrfToken;
      if (
        typeof csrfToken !== 'string' ||
        !csrfToken ||
        /[\r\n;]/.test(csrfToken)
      ) {
        throw createError({
          statusCode: 502,
          statusMessage: 'Backend returned an invalid CSRF token.',
        });
      }

      headers.set('x-csrf-token', csrfToken);
      headers.set('cookie', backendCsrfCookie(csrfResponse.headers));
    }

    // ------------------------------------------------
    // Forward original request to backend
    // ------------------------------------------------
    response = await fetch(target, {
      method,
      headers,
      body: rawBody
        ? new Uint8Array(rawBody)
        : undefined,
      redirect: 'manual',
      signal: controller.signal,
    });
  } catch (error) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Backend connection failed.',
      cause: error,
    });

  } finally {
    clearTimeout(timeout);
  }
  // --------------------------------------------------
  // Prevent unexpected redirects
  // --------------------------------------------------

  if (
    response.status >= 300 &&
    response.status < 400 &&
    response.status !== 304
  ) {
    const redirectLocation = response.headers.get('location');

    await response.body?.cancel();

    throw createError({
      statusCode: 502,
      statusMessage: 'Backend returned an unexpected redirect.',
    });
  }

  // --------------------------------------------------
  // Preserve backend response status and headers
  // --------------------------------------------------

  setResponseStatus(event, response.status);

  backendResponseHeaders(response.headers).forEach(
    (value, name) => {
      setHeader(event, name, value);
    },
  );

  // --------------------------------------------------
  // Handle HEAD and empty responses
  // --------------------------------------------------

  if (method === 'HEAD' || !response.body) {
    return null;
  }

  // --------------------------------------------------
  // Stream backend response without transformation
  // --------------------------------------------------
  return sendStream(event, response.body);
});
