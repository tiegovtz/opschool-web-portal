import apiDocs from "../apiDocs";
import { resolveContentAssetUrl, type MediaUrlOptions } from '../mediaUrls';

export const resolveMediaUrl = (src: string, options: MediaUrlOptions = {}): string => {
  return resolveContentAssetUrl(src, { uploadsBaseURL: apiDocs.baseURL, ...options });
};
