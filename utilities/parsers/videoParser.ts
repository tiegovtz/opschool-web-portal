const videoParser = (query: string): string => {
    // Regular expression to match <video> tags with a <source> inside
    const regex = /<video\b([^>]*)>\s*<source\s+src="([^"]+)"\s+type="([^"]+)"\s*>\s*<\/video>/gi;

    return query.replace(regex, (match, videoAttrs, sourceSrc, sourceType) => {
        return `
            <video ${videoAttrs} controls controlslist="nodownload" oncontextmenu="return false;">
              <source src="${sourceSrc}" type="${sourceType}">
              Your browser does not support the video tag.
            </video>
        `;
    });
}

export default videoParser;
