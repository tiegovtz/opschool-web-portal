
import { ref } from 'vue';
import apiDocs from '~/utilities/api-docs';

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
      });
      return data;
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'An error occurred';
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
      });
      return data;
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'An error occurred';
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
      const data = await $fetch(`${baseUrl}/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // GET all sessions (alternative endpoint)
  const getDataList = async (endpoint:string) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch(`${baseUrl}/${endpoint}`);
      return data;
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'An error occurred';
      throw err;
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
      });
      return data;
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'An error occurred';
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
