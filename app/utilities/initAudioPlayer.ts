let currentPlayingAudio: HTMLAudioElement | null = null;
let currentPlayingBtn: HTMLButtonElement | null = null;

export function initAudioCanvasPlayers() {
  document.querySelectorAll(".play-btn").forEach((btn) => {
    const src = btn.getAttribute("data-audio-src");
    if (!src) return;

    const canvas = btn.parentElement?.querySelector("canvas")!;
    const ctx = canvas.getContext("2d")!;
    const audio = new Audio(src);
    audio.crossOrigin = "anonymous";

    const audioCtx = new AudioContext();
    const sourceNode = audioCtx.createMediaElementSource(audio);
    const analyser = audioCtx.createAnalyser();

    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    let playing = false;

    btn.addEventListener("click", async () => {
      await audioCtx.resume();

      // Pause currently playing audio if it's not this one
      if (currentPlayingAudio && currentPlayingAudio !== audio) {
        currentPlayingAudio.pause();
        if (currentPlayingBtn) {
          currentPlayingBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M19.105 11.446a2.34 2.34 0 0 1-.21 1c-.15.332-.38.62-.67.84l-9.65 7.51a2.3 2.3 0 0 1-1.17.46h-.23a2.2 2.2 0 0 1-1-.24a2.29 2.29 0 0 1-1.28-2v-14a2.2 2.2 0 0 1 .33-1.17a2.27 2.27 0 0 1 2.05-1.1c.412.02.812.148 1.16.37l9.66 6.44c.294.204.54.47.72.78c.19.34.29.721.29 1.11"/></svg>`; // or your play icon SVG
        }
        currentPlayingAudio = null;
        currentPlayingBtn = null;
      }

      if (!playing) {
        audio.play();
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M10.25 5.5v13a1.75 1.75 0 0 1-1.75 1.75h-3a1.75 1.75 0 0 1-1.75-1.75v-13A1.76 1.76 0 0 1 5.5 3.75h3a1.75 1.75 0 0 1 1.75 1.75m10 0v13a1.75 1.75 0 0 1-1.75 1.75h-3a1.75 1.75 0 0 1-1.75-1.75v-13a1.76 1.76 0 0 1 1.75-1.75h3a1.75 1.75 0 0 1 1.75 1.75"/></svg>`;
        // drawWave(analyser, ctx, canvas);
          drawBars(analyser, ctx, canvas);
        currentPlayingAudio = audio;
        currentPlayingBtn = btn as HTMLButtonElement;
      } else {
        audio.pause();
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M19.105 11.446a2.34 2.34 0 0 1-.21 1c-.15.332-.38.62-.67.84l-9.65 7.51a2.3 2.3 0 0 1-1.17.46h-.23a2.2 2.2 0 0 1-1-.24a2.29 2.29 0 0 1-1.28-2v-14a2.2 2.2 0 0 1 .33-1.17a2.27 2.27 0 0 1 2.05-1.1c.412.02.812.148 1.16.37l9.66 6.44c.294.204.54.47.72.78c.19.34.29.721.29 1.11"/></svg>`; 
        currentPlayingAudio = null;
        currentPlayingBtn = null;
      }

      playing = !playing;
    });
  });
}


function drawWave(
  analyser: AnalyserNode,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const render = () => {
    analyser.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#56ade8";
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = (dataArray[i] ?? 0) / 128.0;
      const y = (v * canvas.height) / 2;

      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    requestAnimationFrame(render);
  };

  render();
}

function drawBars(
  analyser: AnalyserNode,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const render = () => {
    analyser.getByteFrequencyData(dataArray); // frequency data for bars

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = ((dataArray[i] ?? 0) / 255) * canvas.height;

      ctx.fillStyle = `rgb(${100 + barHeight}, 120, 255)`; // gradient color effect
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth;
    }

    requestAnimationFrame(render);
  };

  render();
}
