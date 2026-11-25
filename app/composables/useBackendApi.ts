import { createApiDocs } from '../utilities/apiDocs';
import { portalPath } from '../utilities/mediaUrls';

/** Use the same runtime-configured proxy during SSR and browser navigation. */
export function useBackendApi() {
  const config = useRuntimeConfig();
  const api = createApiDocs(portalPath('/api/backend/v1', config.app.baseURL));
  // On SSR this forwards the current request's authentication to the local
  // proxy. The proxy selects the upstream and filters outgoing headers.
  const fetch = useRequestFetch();
  const fetchList = async <T = unknown>(url: string, options?: Parameters<typeof fetch>[1]): Promise<T[]> => {
    const result = await fetch<T[]>(url, options);
    if (!Array.isArray(result)) {
      throw new Error('Backend returned an invalid resource list.');
    }
    return result as T[];
  };
  return { api, fetch, fetchList };
}
