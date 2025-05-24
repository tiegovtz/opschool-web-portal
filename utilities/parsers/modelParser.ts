const modelParser = (query:String) => {
    // Regular expression to match the model and image URLs along with any attributes
    const regex = /model="([^"]+)",&lt;img src="([^"]+)" alt="([^"]+)"&gt;/g;

    // Replace matching patterns with <model-viewer> element
    return query.replace(regex, (match, modelSrc, imgSrc, altText) => {
        return `<model-viewer
              src="${modelSrc}"
              poster="${imgSrc}"
              alt="${altText}"
              auto-rotate
              camera-controls
              shadow-intensity="0.4"
              shadow-softness="0.5"
              shadow="true"
              exposure="0.7"
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="auto"
              ar-placement="floor"
              autoplay
              >
            </model-viewer>`;
    });
}

export default modelParser;