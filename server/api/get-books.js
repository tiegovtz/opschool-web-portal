
export default defineEventHandler(async (event) => {


    try {
      const response = await fetch('https://api.smartdarasa.com/api/v1/demo-topics/677b8e1c792e38e097503930',{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
      });
      

      if (!response.ok) {
        throw createError({ statusCode: response.status, statusMessage: `HTTP error! Status: ${response.status}` });
      }
  
      const data = await response.json();
  
      if(data.message == 'empty' || data.message == 'error' || data.message == 'Missing parameters'){
        return { success: false, error:data.message}
      }
  
      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  });