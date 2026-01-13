// import apiDocs from "../api-docs";

const videoParser = (query: string): string => {
    // Regular expression to match <video> tags with a <source> inside
    const regex = /<video\b([^>]*)>\s*<source\s+src="([^"]+)"(?:\s+type="([^"]+)")?\s*>\s*<\/video>/gi;

    return query.replace(regex, (match, videoAttrs, sourceSrc) => {
        // Extract video ID from sourceSrc (it might already be just the ID or a full path)
        const videoId = sourceSrc.split('/').pop() || sourceSrc;
        
        return `
            <div class="video-container-wrapper my-4">
                <video id='video-player' ${videoAttrs} controls controlslist="nodownload" oncontextmenu="return false;" preload="auto" aria-label="Educational video content">
                  <source src="${`/api/video/`+sourceSrc}" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
                <div class="flex items-center justify-end mt-3">
                    <a 
                        href="/interactive-video?videoId=${videoId}" 
                        class="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-label="Open video in interactive player with quizzes and assessments"
                        role="button"
                        tabindex="0"
                    >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>Interactive Video</span>
                    </a>
                </div>
            </div>
        `;
    });
}

export default videoParser;
