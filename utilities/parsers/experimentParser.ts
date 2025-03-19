const experimentParser = (query:String) => {
    // Regular expression to match the model and image URLs along with any attributes
    const regex = /expPackage="([^"]+)",&lt;img src="([^"]+)" alt="([^"]+)"&gt;/g;

    // Replace matching patterns with <model-viewer> element
    return query.replace(regex, (match, expSrc, imgSrc, altText) => {
        return `<div
              id="experimentPackage"  
              class="w-full rounded-md overflow-hidden cursor-pointer mx-h-[400px]"
              src="${expSrc}"
              poster="${imgSrc}"
              alt="${altText}"
              >
              <img class="w-full h-full object-center object-cover" src="${imgSrc}" alt="${altText}" />
            </div>`;
    });
}

export default experimentParser;