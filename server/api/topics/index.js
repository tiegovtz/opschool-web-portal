
import axios from "axios";
import apiDocs from "~/utilities/api-docs";


export default defineEventHandler(async (event) => {
    const auth_token = getCookie(event,'auth_token')

    try {
        const response = await fetch(apiDocs.topics.getTopics, {
            method: 'GET',
            headers: {
                'Authorization': auth_token
            }
        })

        const data = await response.json()

        if (response.ok) {
            console.log('resp', data,'token',auth_token)
            return response.data; 
        }
        else{
            return { error: 'unauthorized', 'token': auth_token }
        }

        
    } catch (error) {
        console.log('error', error.message)
        return error;
    }
});