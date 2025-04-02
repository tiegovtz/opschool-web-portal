// import { isEmptyObject } from "@tiptap/core";

import apiDocs from "~/utilities/api-docs";

export default defineEventHandler(async (event) => {
    const { chapterId } = getRouterParams(event); // Get query parameters
    const auth_token = getCookie(event, 'signInAccessToken');

    if (!auth_token) {
        return createError({
            statusCode: 401,
            message: 'No authorization token provided'
        });
    }

    if (!chapterId) {
        return createError({
            statusCode: 401,
            message: 'Refference error: No identifier provided'
        });
    }

    try {
        const response = await fetch(apiDocs.chapters.getChapterId.replaceAll(':id', chapterId), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${auth_token}`
            }
        });


        if (!response.ok) {
            return createError({
                statusCode: response.status,
                message: `API returned ${response.status}: ${response.statusText}`
            });
        }



        return await response.json();
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'An unknown error occurred' 
        };
    }
});