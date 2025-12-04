import apiDocs from "~/utilities/apiDocs";

export default defineEventHandler(async (event) => {

    const auth_token = getCookie(event, "signInAccessToken");
    const body = await readBody(event);

    if (!auth_token) {
        return createError({
            statusCode: 401,
            message: "No authorization token provided",
        });
    }

    if (!body) {
        return createError({
            statusCode: 400,
            message: "Bad request: No request body provided",
        });
    }

    try {
        const response = await fetch(apiDocs.progressTracking.postProgress, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${auth_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return createError({
                statusCode: response.status,
                message: `API returned ${response.status}: ${response.statusText}`,
            });
        }

    } catch (error) {
        return createError({
            statusCode: 500,
            message: error.message || "Internal server error",
        });
    }
});
