
import axios from "axios";
import apiDocs from "~/utilities/api-docs";


export default defineEventHandler(async (event) => {
   await axios.get(apiDocs.topics.getTopics).then((response)=>{
    console.log('resp',response)
    return response.data;
   }).catch((error)=>{
       console.log('error', error.message)
     return error;
   })
});