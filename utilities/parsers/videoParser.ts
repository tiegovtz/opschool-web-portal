// // This function parses a string containing HTML and replaces <video> tags with a custom video player implementation.
//<video width="300" height="150" controls="controls">
// <source src="67d7b7b753661731a20de29a"></video>
// Regular expression to match <video> tags with a <source> inside
const uid = Math.random().toString(36).substring(2, 10);
const regex = /<video\b[^>]*>\s*<source\s+[^>]*src=(["'])(.*?)\1[^>]*>\s*<\/video>/gi;

const videoParser = (query: string): string => {

    return query.replace(regex, (match, videoAttrs, sourceSrc) => {
        return `
            <video id='video-player' ${videoAttrs} controls controlslist="nodownload" oncontextmenu="return false;" preload="auto">
              <source src="${`/api/video/`+sourceSrc}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
        `;
    });
}

const videoParserBlob = (query: string): string => {
    return query.replace(regex, (match, videoAttrs, sourceSrc) => {
  
      return `
       <div class="canvas-video-wrapper" data-video-src="${sourceSrc}" data-uid="${uid}">
        <canvas id="canvas-${uid}" width="640" height="360" style="background: black;"></canvas>
        <div class="canvas-video-controls">
          <button id="play-${uid}" class="canvas-video-play">▶️ Play</button>
          <button id="pause-${uid}" class="canvas-video-pause">⏸️ Pause</button>
        </div>
      </div>
      `;
    });
  };
  
  export  {videoParser,videoParserBlob};
  
