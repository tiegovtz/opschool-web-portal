export default defineEventHandler(async (event) => {
    const response = await $fetch.raw('/api/backend/v1/auth/forgot-password', {
        method: 'POST',
        body: await readBody(event),
        ignoreResponseError: true,
    });
    if (response.status >= 400) {
        const data = response._data;
        throw createError({
            statusCode: response.status,
            statusMessage: typeof data?.message === 'string'
                ? data.message
                : typeof data?.error === 'string'
                    ? data.error
                    : response.statusText,
            data,
        });
    }
    return response._data;
});
