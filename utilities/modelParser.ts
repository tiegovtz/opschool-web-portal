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
              shadow-intensity="1"
              shadow-softness="1"
              shadow="true"
              exposure="1.5"
              >
            </model-viewer>`;
    });
}

export default modelParser;