import { resolveUploadUrl } from "../resolveUploadUrl";

const modelParser = (query: String, uploadsBaseUrl: string = "") => {
    // Regular expression to match the model and image URLs along with any attributes
    const regex = /model="([^"]+)",&lt;img src="([^"]+)" alt="([^"]+)"&gt;/g;

    // Replace matching patterns with <model-viewer> element
    return query.replace(regex, (match, modelSrc, imgSrc, altText) => {
        return `<model-viewer

              src="${resolveUploadUrl(modelSrc, uploadsBaseUrl)}"
              poster="${resolveUploadUrl(imgSrc, uploadsBaseUrl)}"
              alt="${altText}"
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