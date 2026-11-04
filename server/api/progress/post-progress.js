export default defineEventHandler(async (event) => {

    const bearerToken = getHeader(event, "authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
    const auth_token = bearerToken || getCookie(event, "signInAccessToken");
    const body = await readBody(event);

    if (!auth_token) {
        throw createError({
            statusCode: 401,
            message: "No authorization token provided",
        });
    }

    if (!body) {
        throw createError({
            statusCode: 400,
            message: "Bad request: No request body provided",
        });
    }

    try {
        return await $fetch('/api/backend/v1/progress', {
            method: "POST",
            headers: {
                Authorization: `Bearer ${auth_token}`,
                "Content-Type": "application/json",
            },
            body,
        });
    } catch (error) {
        throw createError({
            statusCode: Number(error?.statusCode || error?.status || 500),
            message: error.message || "Internal server error",
        });
    }
});
