import apiDocs from "~/utilities/apiDocs";

export default defineEventHandler(async (event) => {
    try {
         
        // Parse request body
        const body = await readBody(event);
        const url = apiDocs.auth.signUp;  

        // Make the request to the external API
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" }, // Ensure proper headers
            body: JSON.stringify(body), // Stringify body properly
        });

        const responseText = await response.text();
        let parsedBody = null;

        try {
            parsedBody = responseText ? JSON.parse(responseText) : null;
        } catch {
            parsedBody = responseText || null;
        }

        if (!response.ok) {
            throw createError({
                statusCode: response.status,
                statusMessage:
                    parsedBody?.message ||
                    parsedBody?.error ||
                    `HTTP error! Status: ${response.status}`,
                data: parsedBody,
            });
        }

        return parsedBody;
    } catch (error) {
        console.error("API Error:", error);

        if (error?.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error"
        });
    }
});
