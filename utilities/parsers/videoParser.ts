// import apiDocs from "../api-docs";

const videoParser = (query: string): string => {
    // Regular expression to match <video> tags with a <source> inside
    const regex = /<video\b([^>]*)>\s*<source\s+src="([^"]+)"(?:\s+type="([^"]+)")?\s*>\s*<\/video>/gi;

    return query.replace(regex, (match, videoAttrs, sourceSrc) => {
        return `
            <video id='video-player' ${videoAttrs} controls controlslist="nodownload" oncontextmenu="return false;" preload="auto">
              <source src="${`/api/video/`+sourceSrc}" type="application/x-mpegURL">
              Your browser does not support the video tag.
            </video>
        `;
    });
}

export default videoParser;
