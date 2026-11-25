import { resolveMediaUrl } from "./mediaUrl";
import { escapeHtmlAttribute, type MediaUrlOptions } from '../mediaUrls';

const modelParser = (query: string, options: MediaUrlOptions = {}) => {
    // Regular expression to match the model and image URLs along with any attributes
    const regex = /model="([^"]+)",&lt;img src="([^"]+)" alt="([^"]+)"&gt;/g;

    // Replace matching patterns with <model-viewer> element
    return query.replace(regex, (match, modelSrc, imgSrc, altText) => {
        return `<model-viewer
                
              src="${escapeHtmlAttribute(resolveMediaUrl(modelSrc, options))}"
              poster="${escapeHtmlAttribute(resolveMediaUrl(imgSrc, options))}"
              alt="${escapeHtmlAttribute(altText)}"
              auto-rotate
              camera-controls
              shadow-intensity="0.4"
              shadow-softness="0.5"
              shadow="true"
              exposure="0.7"
              autoplay
              >
            </model-viewer>`;
    });
}

export default modelParser;
