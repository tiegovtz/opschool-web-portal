import { createApiDocs } from "~/utilities/apiDocs";

// Existing server features call the upstream directly, without a proxy round trip.
export default createApiDocs(useRuntimeConfig().backendApiBaseUrl.replace(/\/$/, ""));
