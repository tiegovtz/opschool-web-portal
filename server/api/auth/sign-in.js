import apiDocs from "~/utilities/api-docs";

export default defineEventHandler(async (event) => {
    try {
         
        // Parse request body
        const body = await readBody(event);
        const url = apiDocs.auth.login;  

        // Make the request to the external API
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" }, // Ensure proper headers
            body: JSON.stringify(body), // Stringify body properly
        });

        if (!response.ok) {
            throw createError({
                statusCode: response.status,
                statusMessage: `HTTP error! Status: ${response.status}`
            });
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Error:", error);

        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error"
        });
    }
});
