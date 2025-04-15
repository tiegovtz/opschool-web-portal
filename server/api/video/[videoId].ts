// // import { isEmptyObject } from "@tiptap/core";
import apiDocsFile from "~/utilities/api-docs";
// import Hls from 'hls.js';

export default defineEventHandler(async (event) => {
  // get refferer header
  // Get the referer header
  const referer = getHeader(event, "referer");
  const apiDocs = apiDocsFile.setup()
// Check if the referer is valid
if (
    referer &&
    (referer?.includes("/interactive/form") || referer?.includes("/video"))
  ) {
    const { videoId } = getRouterParams(event); // Get query parameters
    const auth_token = getCookie(event, "signInAccessToken");

    if (!auth_token) {
      throw createError({
        statusCode: 401,
        message: "No authorization token provided",
      });
    }

    if (!videoId) {
      throw createError({
        statusCode: 400,
        message: "Reference error: No identifier provided",
      });
    }

    const videoUrl = `${apiDocs.videos.getStream}${videoId}`;

    // Forward the request with headers (including the Authorization token)
    return proxyRequest(event, videoUrl, {
      headers: {
        Authorization: `Bearer ${auth_token}`,
      },
    });
  } else {
    //     return createError({ statusCode: 403, message: 'Access denied' });
    sendRedirect(event, "/error/access-denied", 301); // permanent Redirect
  }
});


// import { exec } from "child_process"; // Import exec from child_process module

// export default defineEventHandler(async (event) => {
//   const referer = getHeader(event, "referer");
//   const apiDocs = apiDocsFile.setup();
  
//   // Check if the referer is valid (you can adjust this)
//   if (referer && (referer?.includes("/interactive/form") || referer?.includes("/video"))) {
    
//     const { videoId } = getRouterParams(event);
//     const auth_token = getCookie(event, "signInAccessToken");

//     if (!auth_token) {
//       throw createError({ statusCode: 401, message: "No authorization token provided" });
//     }

//     if (!videoId) {
//       throw createError({ statusCode: 400, message: "Reference error: No identifier provided" });
//     }

//     const videoUrl = `${apiDocs.videos.getStream}${videoId}`;

//     // Set up FFmpeg to convert stream to HLS format
//     const ffmpegCommand = `ffmpeg -i ${videoUrl} \
//     -headers "Authorization: Bearer ${auth_token}" \
//     -c:v libx264 \
//     -c:a aac \
//     -preset veryfast \
//     -f hls \
//     -hls_time 10 \
//     -hls_list_size 0 \
//     -hls_segment_filename "output/segment%03d.ts" \
//     -hls_flags delete_segments \
//     -hls_playlist_type event "output/stream.m3u8"`;
//   //  end

//     const ffmpegProcess = exec(ffmpegCommand);

//     ffmpegProcess?.stdout?.pipe(event.res); // Pipe the HLS stream response back to the client

//     ffmpegProcess?.stderr?.on("data", (data) => {
//       console.error("FFmpeg stderr:", data.toString());
//     });

//     ffmpegProcess.on("exit", (code) => {
//       if (code !== 0) {
//         event.res.statusCode = 500;
//         event.res.end("Error processing video stream");
//       }
//     });
//   } else {
//     sendRedirect(event, "/error/access-denied", 301); // Redirect on invalid referer
//   }
// });
