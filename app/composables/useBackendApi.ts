import { createApiDocs } from '../utilities/apiDocs';
import { portalPath } from '../utilities/mediaUrls';

/** Use the same runtime-configured proxy during SSR and browser navigation. */
export function useBackendApi() {
  const config = useRuntimeConfig();
  const api = createApiDocs(portalPath('/api/backend/v1', config.app.baseURL));
  // On SSR this forwards the current request's authentication to the local
  // proxy. The proxy selects the upstream and filters outgoing headers.
  const fetch = useRequestFetch();
  return { api, fetch };
}
