// Script to list 10 videos from the API
// Run with: node list-videos.js

const baseURL = process.env.VITE_API_BASE_URL || "https://apitie.ekima.africa/v1";

async function fetchVideos() {
  try {
    console.log('Fetching videos from:', `${baseURL}/public-videos`);
    
    const response = await fetch(`${baseURL}/public-videos?videoType=Conceptual&limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const videos = await response.json();
    
    console.log('\n=== 10 Videos Accessible via API ===\n');
    
    if (Array.isArray(videos) && videos.length > 0) {
      videos.slice(0, 10).forEach((video, index) => {
        console.log(`${index + 1}. ${video.title || video.name || 'Untitled Video'}`);
        console.log(`   ID: ${video._id || video.id}`);
        console.log(`   Subject: ${video.subject?.name || video.subject || 'N/A'}`);
        console.log(`   Level: ${video.educationLevel?.name || video.educationLevel || 'N/A'}`);
        console.log(`   Video Type: ${video.videoType || 'N/A'}`);
        console.log(`   Access URL: /api/video/${video._id || video.id}`);
        console.log('');
      });
    } else if (videos.data && Array.isArray(videos.data)) {
      videos.data.slice(0, 10).forEach((video, index) => {
        console.log(`${index + 1}. ${video.title || video.name || 'Untitled Video'}`);
        console.log(`   ID: ${video._id || video.id}`);
        console.log(`   Subject: ${video.subject?.name || video.subject || 'N/A'}`);
        console.log(`   Level: ${video.educationLevel?.name || video.educationLevel || 'N/A'}`);
        console.log(`   Video Type: ${video.videoType || 'N/A'}`);
        console.log(`   Access URL: /api/video/${video._id || video.id}`);
        console.log('');
      });
    } else {
      console.log('No videos found or unexpected response format');
      console.log('Response:', JSON.stringify(videos, null, 2));
    }
  } catch (error) {
    console.error('Error fetching videos:', error.message);
    console.error('\nNote: This script requires network access and may need authentication.');
    console.log('\nTo use videos in the interactive video player, you can access them via:');
    console.log('/api/video/{videoId}');
    console.log('\nExample: /api/video/680e2ba64750cdf4e8ed331b');
  }
}

fetchVideos();























