import { resolveContentAssetUrl, resolveStreamUrl, portalPath } from '../utilities/mediaUrls';

export const useMediaUrls = () => {
  const config = useRuntimeConfig();
  const options = { appBaseURL: config.app.baseURL, uploadsBaseURL: String(config.public.uploadsBaseUrl || '/api') };
  return {
    options,
    asset: (src: string | null | undefined) => resolveContentAssetUrl(src || '', options),
    video: (src: string) => resolveStreamUrl(src, 'video', options),
    audio: (src: string) => resolveStreamUrl(src, 'audio', options),
    portal: (path: string) => portalPath(path, options.appBaseURL),
  };
};
