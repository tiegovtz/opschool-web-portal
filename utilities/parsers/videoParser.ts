import apiDocs from "../api-docs";

const videoParser = (query: string): string => {
    // Regular expression to match <video> tags with a <source> inside
    const regex = /<video\b([^>]*)>\s*<source\s+src="([^"]+)"\s*>\s*<\/video>/gi;

    return query.replace(regex, (match, videoAttrs, sourceSrc) => {
        return `
            <video class='videoPlayer' ${videoAttrs} controls controlslist="nodownload" oncontextmenu="return false;" preload="auto">
              <source src="${apiDocs.videos.getStream+sourceSrc}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
        `;
    });
}

export default videoParser;
