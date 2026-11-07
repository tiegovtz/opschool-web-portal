export default defineEventHandler(async (event) => {
    const response = await $fetch.raw('/api/backend/v1/auth/forgot-password', {
        method: 'POST',
        body: await readBody(event),
        ignoreResponseError: true,
    });
    const data = response._data;
    const bodyStatus = Number(data?.statusCode);
    if (response.status >= 400 || (bodyStatus >= 400 && bodyStatus < 600)) {
        throw createError({
            statusCode: response.status >= 400 ? response.status : bodyStatus,
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
