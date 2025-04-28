// ~/plugins/canvas-video.client.ts

export default defineNuxtPlugin((nuxtApp) => {
  let isInitializing = false;
let initTimeout: ReturnType<typeof setTimeout> | null = null;

const initCanvasVideoPlayers = () => {let isInitializing = false;
  let initTimeout: ReturnType<typeof setTimeout> | null = null;
  
  const initCanvasVideoPlayers = () => {
    if (isInitializing) return; // 🛑 Skip if already running
    isInitializing = true;
  
    if (initTimeout) clearTimeout(initTimeout);
  
    initTimeout = setTimeout(() => {

      console.log('Initializing canvas video players...');
      document.querySelectorAll('.canvas-video-wrapper:not([data-init="true"])')
        .forEach(wrapper => {
          const videoSrc = wrapper.getAttribute('data-video-src') || wrapper.getAttribute('data-src');
          const uid = wrapper.getAttribute('data-uid');
          const canvas = wrapper.querySelector(`#canvas-${uid}`) as HTMLCanvasElement;
          const playBtn = wrapper.querySelector(`#play-${uid}`) as HTMLButtonElement;
          const pauseBtn = wrapper.querySelector(`#pause-${uid}`) as HTMLButtonElement;

          // Check if elements are found
          console.log('videoSrc', videoSrc);
          console.log('canvas', canvas);
          console.log('playBtn', playBtn);
          console.log('pauseBtn', pauseBtn);
          // If any of the elements are not found, skip initialization
  
          if (!videoSrc || !canvas || !playBtn || !pauseBtn) return;
  
          const ctx = canvas.getContext('2d');
          const video = document.createElement('video');
          video.src = `/api/video/get-blob/${videoSrc}`; //video blob URL is passed here
          video.crossOrigin = "anonymous";
          video.preload = "auto";
          video.muted = true;
          video.style.display = "none"; // Make it invisible
  
          // Draw the video on the canvas when it plays
          const draw = () => {
            if (!video.paused && !video.ended) {
              ctx?.drawImage(video, 0, 0, canvas.width, canvas.height); // Draw video on canvas
              requestAnimationFrame(draw); // Continue drawing frames
            }
          };
  
          playBtn.addEventListener('click', () => {
            video.play();
            console.log('play');
            ctx?.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing
            draw(); // Start drawing frames when the video plays
          });
  
          pauseBtn.addEventListener('click', () => {
            video.pause();
          });
  
          video.addEventListener('ended', () => {
            video.currentTime = 0;
            ctx?.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas when video ends
          });
  
          wrapper.setAttribute('data-init', 'true'); // ✅ Mark as initialized
        });
  
      isInitializing = false;
    }, 50); // Throttle updates to avoid infinite loop
  };
  
};

});
// This plugin initializes a custom video player using a canvas element.
// It listens for DOM changes and retries initialization if the elements are not found immediately.
// The player allows for play/pause functionality and draws the video frame onto the canvas.
// The video is muted and set to preload for better performance.