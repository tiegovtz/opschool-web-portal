export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed'
    });
  }

  const config = useRuntimeConfig();
  const openaiApiKey = config.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw createError({
      statusCode: 500,
      message: 'Missing OPENAI_API_KEY environment variable'
    });
  }

  try {
    const body = await readBody(event);
    const workflowId = body?.workflow?.id || body?.workflowId || config.public.CHATKIT_WORKFLOW_ID || process.env.NUXT_PUBLIC_CHATKIT_WORKFLOW_ID;

    if (!workflowId) {
      throw createError({
        statusCode: 400,
        message: 'Missing workflow id'
      });
    }

    // Handle user session cookie
    const SESSION_COOKIE_NAME = 'chatkit_session_id';
    const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
    
    let userId = getCookie(event, SESSION_COOKIE_NAME);
    if (!userId) {
      userId = crypto.randomUUID();
      setCookie(event, SESSION_COOKIE_NAME, userId, {
        maxAge: SESSION_COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
      });
    }

    const apiBase = config.CHATKIT_API_BASE || process.env.CHATKIT_API_BASE || 'https://api.openai.com';
    const url = `${apiBase}/v1/chatkit/sessions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
        'OpenAI-Beta': 'chatkit_beta=v1',
      },
      body: JSON.stringify({
        workflow: { id: workflowId },
        user: userId,
        chatkit_configuration: {
          file_upload: {
            enabled: body?.chatkit_configuration?.file_upload?.enabled ?? false,
          },
        },
      }),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = extractErrorDetail(responseData, response.statusText);
      throw createError({
        statusCode: response.status,
        message: errorMessage || `Failed to create session: ${response.statusText}`
      });
    }

    return {
      client_secret: responseData?.client_secret ?? null,
      expires_after: responseData?.expires_after ?? null,
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error('Create session error', error);
    throw createError({
      statusCode: 500,
      message: error?.message || 'Unexpected error'
    });
  }
});

function extractErrorDetail(payload: any, fallback: string): string {
  if (!payload) {
    return fallback;
  }

  const error = payload.error;
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  const details = payload.details;
  if (typeof details === 'string') {
    return details;
  }

  if (details && typeof details === 'object' && 'error' in details) {
    const nestedError = details.error;
    if (typeof nestedError === 'string') {
      return nestedError;
    }
    if (nestedError && typeof nestedError === 'object' && 'message' in nestedError && typeof nestedError.message === 'string') {
      return nestedError.message;
    }
  }

  if (typeof payload.message === 'string') {
    return payload.message;
  }

  return fallback;
}




