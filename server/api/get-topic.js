// import { isEmptyObject } from "@tiptap/core";

export default defineEventHandler(async (event) => {
    const query = getQuery(event); // Get query parameters


    try {
      const response = await fetch('https://kisomo.co.tz/kisomo app/kisomo_schools/backend/test-new-admin/php/getTopics.php',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
      });
      

      if (!response.ok) {
        throw createError({ statusCode: response.status, statusMessage: `HTTP error! Status: ${response.status}` });
      }
  
      const data = await response.json();
  
      if(data.message == 'empty' || data.message == 'error' || data.message == 'Missing parameters'){
        return { success: false, error:data.message}
      }
  
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  });