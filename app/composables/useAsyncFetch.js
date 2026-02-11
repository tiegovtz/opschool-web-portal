import { ref, getCurrentInstance } from 'vue';

const clientCache = new Map();
const clientPending = new Map();

const wrapResult = (value, statusValue = 'success', errorValue = null, refresh) => ({
  data: ref(value),
  status: ref(statusValue),
  error: ref(errorValue),
  refresh,
});

// composables/useAsyncFetch.js
export const fetchAsyncData = async (id, callback) => {
  const inSetup = Boolean(getCurrentInstance());

  if (import.meta.env.SSR && inSetup) {
    // SSR (Server Side Render) or Initial Page Load
    const { data, status, error, refresh } = await useAsyncData(id, callback);
    return { data, status, error, refresh };
  }

  // Client-side caching to avoid duplicate fetches
  if (import.meta.client && clientCache.has(id)) {
    return wrapResult(clientCache.get(id), 'success', null, () => fetchAsyncData(id, callback));
  }
  if (import.meta.client && clientPending.has(id)) {
    const pending = clientPending.get(id);
    try {
      const data = await pending;
      return wrapResult(data, 'success', null, () => fetchAsyncData(id, callback));
    } catch (error) {
      return wrapResult(null, 'error', error, () => fetchAsyncData(id, callback));
    }
  }

  const status = ref('pending');
  const error = ref(null);
  const exec = async () => {
    status.value = 'pending';
    const data = await callback();
    if (import.meta.client) {
      clientCache.set(id, data);
    }
    status.value = 'success';
    return data;
  };

  const promise = exec().catch((err) => {
    error.value = err;
    status.value = 'error';
    throw err;
  });

  if (import.meta.client) {
    clientPending.set(id, promise);
  }

  try {
    const data = await promise;
    return { data: ref(data), status, error, refresh: () => fetchAsyncData(id, callback) };
  } finally {
    if (import.meta.client) {
      clientPending.delete(id);
    }
  }
};
