
import { ref } from 'vue';
import apiDocs from '~/utilities/apiDocs';

export function useSessionsSetup() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const baseUrl = apiDocs.baseURL;
const token = useCookie('signInAccessToken').value;
  // POST create session
  const postData = async (payload: any,endpoint:string) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch(`${baseUrl}/${endpoint}`, {
        method: 'POST',
        body: payload,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      });
      return data;
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'An error occurred';
      console.error(`[useSessions] POST ${endpoint} failed:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // PUT update session by ID
  const editData = async (payload: any,endpoint:string) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch(`${baseUrl}/${endpoint}`, {
        method: 'PUT',
        body: payload,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      });
      return data;
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'An error occurred';
      console.error(`[useSessions] PUT ${endpoint} failed:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // GET sessions list
  const getData = async (endpoint:string) => {
    loading.value = true;
    error.value = null;
    try {
      const {data }= await useAsyncData(`data-for-${endpoint}`,()=> $fetch(`${baseUrl}/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      }))
      return data.value;
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'An error occurred';
      console.error(`[useSessions] GET ${endpoint} failed:`, err);
      // Return null instead of throwing to allow UI to continue
      return null;
    } finally {
      loading.value = false;
    }
  };

  // GET all sessions (alternative endpoint)
  const getDataList = async (endpoint:string) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch(`${baseUrl}/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      });
      return data;
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'An error occurred';
      console.error(`[useSessions] GET ${endpoint} failed:`, err);
      return null; // Return null instead of throwing
    } finally {
      loading.value = false;
    }
  };

  // DELETE session by ID
  const deleteData = async (endpoint:string) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch(`${baseUrl}/${endpoint}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      });
      return data;
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'An error occurred';
      console.error(`[useSessions] DELETE ${endpoint} failed:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    postData,
    editData,
    getData,
    getDataList,
    deleteData,
  };
}
