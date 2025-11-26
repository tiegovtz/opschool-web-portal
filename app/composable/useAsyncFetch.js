// composables/useAsyncFetch.js
export const fetchAsyncData = async (id, callback) => {
  if (import.meta.env.SSR) {
    // SSR (Server Side Render) or Initial Page Load
    const { data, status, error, refresh } = await useAsyncData(id, callback);
    return { data, status, error, refresh };
  } else {
    // Client Side

    const data = ref(null);
    const status = ref("pending"); // "pending", "success", "error"
    const error = ref(null);
    try {
      status.value = 'pending';
      data.value = await callback();
      status.value = "success";

      return {
        data: data,
        status: status,
        error: error,
        refresh: callback,
      };
    } catch (_error) {

       error.value = _error 
      return {
        data: data,
        status: status,
        error: error,
        refresh: callback,
      };
    }
  }
};
