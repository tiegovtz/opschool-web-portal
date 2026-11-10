export const fetchAsyncData = async (id, callback) => {
  if (import.meta.env.SSR) {
    const { data, status, error, refresh } = await useAsyncData(id, callback);
    return { data, status, error, refresh };
  }

  const data = ref(null);
  const status = ref('pending');
  const error = ref(null);
  const nuxtApp = useNuxtApp();

  const refresh = async () => {
    status.value = 'pending';
    error.value = null;
    try {
      data.value = await callback();
      status.value = 'success';
    } catch (err) {
      error.value = err;
      status.value = 'error';
    }
  };

  // Reuse the result serialized by useAsyncData during hydration.
  // Later calls (including filter changes) must still fetch fresh data.
  if (nuxtApp.isHydrating && nuxtApp.payload.data[id] != null) {
    data.value = nuxtApp.payload.data[id];
    status.value = 'success';
  } else {
    await refresh();
  }

  return { data, status, error, refresh };
};
