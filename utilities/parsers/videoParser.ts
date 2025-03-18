const videoParser = (query:String) => {
    // Regular expression to match the model and image URLs along with any attributes
    const regex = /model="([^"]+)",&lt;img src="([^"]+)" alt="([^"]+)"&gt;/g;

    // Replace matching patterns with <model-viewer> element
    return query.replace(regex, (match, modelSrc, imgSrc, altText) => {
        return `<video
             
              src="${modelSrc}"
              poster="${imgSrc}"
              alt="${altText}"  
              controls="true"
              download="false"
              >
            </video>`;
    });
}

export default videoParser;