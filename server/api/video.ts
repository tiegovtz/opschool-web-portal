import { createReadStream } from 'fs';
import { resolve } from 'path';
import { defineEventHandler, setResponseHeaders, sendStream } from 'h3';

export default defineEventHandler(async (event) => {
  // Get the video ID from query params
  const query = getQuery(event);
  const videoId = query.id || 'default'; // Default video if no ID is provided
  
  // Resolve the path of the video (ensure it's an absolute path)
  const videoPath = resolve('/path-to-your-videos', `${videoId}.mp4`);

  // Set headers for the video response
  setResponseHeaders(event, {
    'Content-Type': 'video/mp4',
    'Content-Disposition': 'inline', // Inline display of video
  });

  // Return the video stream to the client
  return sendStream(event, createReadStream(videoPath));
});
