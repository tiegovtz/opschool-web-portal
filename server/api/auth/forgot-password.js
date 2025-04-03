import apiDocs from "~/utilities/api-docs";



export default defineEventHandler(async (event) => {
     
    const body = await readBody(event);
    const url = apiDocs.auth.forgotPassword;
    try {

        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw createError({
                statusCode: response.status,
                statusMessage: `HTTP error! Status: ${response.status}`
            });
        }

        // return response
        return await response.json();
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }
});
