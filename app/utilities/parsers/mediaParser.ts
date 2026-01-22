// import apiDocs from "../api-docs";
const parseHTML = (html: string): Document => {
  return new DOMParser().parseFromString(html, "text/html");
};

const videoParser = (query: string): string => {
  // Regular expression to match <video> tags with a <source> inside
  const regex =
    /<video\b([^>]*)>\s*<source\s+src="([^"]+)"(?:\s+type="([^"]+)")?\s*>\s*<\/video>/gi;

  return query.replace(regex, (match, videoAttrs, sourceSrc) => {
    // Extract video ID from sourceSrc (it might already be just the ID or a full path)
    const videoId = sourceSrc.split("/").pop() || sourceSrc;

    return `
            <div class="video-container-wrapper my-4">
                <video id='video-player' ${videoAttrs} controls controlslist="nodownload" oncontextmenu="return false;" preload="auto" aria-label="Educational video content">
              <source src="${`/api/video/` + sourceSrc}" type="video/mp4">
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
};

// audio parser
const audioParser = (html: string): string => {
  const doc = parseHTML(html);

  const audios = doc.querySelectorAll("audio");
  
  audios.forEach((audio, index) => {
    let src = audio.getAttribute("src");

    if (!src) {
      const source = audio.querySelector("source");
      src = source?.getAttribute("src") ?? null;
    }
    if (!src) return;
    const wrapper = doc.createElement("div");
    wrapper.className = "audio-canvas-wrapper";
    wrapper.innerHTML = `
      <div class="flex items-center flex-row-reverse">
        <button 
          class="play-btn bg-oceanBlue text-white px-3 py-1 rounded-full h-10 w-10 flex items-center justify-center"
          data-audio-src="${src}"
          aria-label="Play audio"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M19.105 11.446a2.34 2.34 0 0 1-.21 1c-.15.332-.38.62-.67.84l-9.65 7.51a2.3 2.3 0 0 1-1.17.46h-.23a2.2 2.2 0 0 1-1-.24a2.29 2.29 0 0 1-1.28-2v-14a2.2 2.2 0 0 1 .33-1.17a2.27 2.27 0 0 1 2.05-1.1c.412.02.812.148 1.16.37l9.66 6.44c.294.204.54.47.72.78c.19.34.29.721.29 1.11"/></svg>
        </button>

        <canvas 
          width="300" 
          height="40" 
          class="audio-wave-canvas flex-1"
          data-audio-src="${src}"
        ></canvas>
      </div>
    `;

    audio.replaceWith(wrapper);
  });

  return doc.body.innerHTML;
};

// combime both media parsers
const mediaParser = (html: string): string => {
  let parsedHTML = videoParser(html);
  parsedHTML = audioParser(parsedHTML);
  return parsedHTML;
}
export { videoParser, audioParser ,mediaParser};
