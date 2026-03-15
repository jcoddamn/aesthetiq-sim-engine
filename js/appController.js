import { startFaceTracking } from './mediapipeRunner.js';
import { runProcedureSimulationFromImage, renderResultsToTargets } from './simulationPipeline.js';
import { getProcedureLabel, getViewerProcedure, getProcedureColor } from './procedureMap.js';
import { getProcedureMask } from './mediapipeMasks.js';
import { drawPolygonOutline } from './maskUtils.js';
import { createLandmarkSmoother } from './landmarkSmoothing.js';

let latestLandmarks = null;
let currentProcedure = 'underEyeFiller';

const smoothLandmarks = createLandmarkSmoother(0.75);

const video = document.getElementById('camera');
const cameraPreview = document.getElementById('cameraPreview');

const maskCanvas = document.getElementById('maskPreview');
const subtleCanvas = document.getElementById('subtleResult');
const moderateCanvas = document.getElementById('moderateResult');
const extremeCanvas = document.getElementById('extremeResult');

const procedureLabel = document.getElementById('selectedProcedure');
const trackingStatus = document.getElementById('trackingStatus');

const simulateButton = document.getElementById('simulateButton');
const retakeButton = document.getElementById('retakeButton');

const showLandmarksToggle = document.getElementById('showLandmarksToggle');
const showRegionsToggle = document.getElementById('showRegionsToggle');

initApp();

function initApp() {
  if (!video) {
    console.error('Camera video element not found');
    setStatus('Camera element missing');
    return;
  }

  bindProcedureButtons();

  if (simulateButton) {
    simulateButton.addEventListener('click', () => {
      runCurrentSimulation();
    });
  }

  if (retakeButton) {
    retakeButton.addEventListener('click', resetPreview);
  }

  updateProcedureLabel();
  setStatus('Starting camera…');

  startFaceTracking(
    video,
    (landmarks) => {
      latestLandmarks = smoothLandmarks(landmarks);
    },
    (statusText) => {
      setStatus(statusText);
    }
  );

  startPreviewLoop();
}

function bindProcedureButtons() {
  document.querySelectorAll('.procedure-button').forEach((button) => {
    button.addEventListener('click', () => {
      currentProcedure = button.dataset.procedure;
      updateProcedureLabel();
      updateActiveProcedureButtons();
    });
  });

  updateActiveProcedureButtons();
}

function updateActiveProcedureButtons() {
  document.querySelectorAll('.procedure-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.procedure === currentProcedure);
  });
}

function updateProcedureLabel() {
  if (procedureLabel) {
    procedureLabel.textContent = getProcedureLabel(currentProcedure);
  }
}

function setStatus(text) {
  if (trackingStatus) {
    trackingStatus.textContent = text;
  }
}

function startPreviewLoop() {
  function loop() {
    drawCameraPreview();
    requestAnimationFrame(loop);
  }

  loop();
}

function drawCameraPreview() {
  if (!video || !cameraPreview) return;
  if (!video.videoWidth || !video.videoHeight) return;

  cameraPreview.width = video.videoWidth;
  cameraPreview.height = video.videoHeight;

  const ctx = cameraPreview.getContext('2d');
  ctx.clearRect(0, 0, cameraPreview.width, cameraPreview.height);
  ctx.drawImage(video, 0, 0, cameraPreview.width, cameraPreview.height);

  if (latestLandmarks) {
    if (showLandmarksToggle?.checked) {
      drawLandmarks(latestLandmarks);
    }

    if (showRegionsToggle?.checked) {
      drawSelectedProcedureRegion(latestLandmarks);
    }
  }
}

function drawLandmarks(landmarks) {
  if (!cameraPreview || !landmarks) return;

  const ctx = cameraPreview.getContext('2d');
  ctx.fillStyle = '#00ff88';

  for (const point of landmarks) {
    const x = point.x * cameraPreview.width;
    const y = point.y * cameraPreview.height;

    ctx.beginPath();
    ctx.arc(x, y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSelectedProcedureRegion(landmarks) {
  const polygons = getProcedureMask(
    currentProcedure,
    landmarks,
    cameraPreview.width,
    cameraPreview.height
  );

  if (!polygons || !polygons.length) return;

  const ctx = cameraPreview.getContext('2d');
  const color = getProcedureColor(currentProcedure);

  polygons.forEach((poly) => {
    drawPolygonOutline(ctx, poly, color, 2);
  });
}

function resetPreview() {
  [maskCanvas, subtleCanvas, moderateCanvas, extremeCanvas].forEach((canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  setStatus('Preview reset');
}

function setGenerateButtonLoading(isLoading) {
  if (!simulateButton) return;

  simulateButton.disabled = isLoading;
  simulateButton.textContent = isLoading ? 'Generating…' : 'Generate Preview';
}

export function runCurrentSimulation() {
  if (!latestLandmarks) {
    setStatus('No face detected yet');
    return;
  }

  try {
    setGenerateButtonLoading(true);
    setStatus('Generating previews…');

    const results = runProcedureSimulationFromImage({
      procedure: currentProcedure,
      landmarks: latestLandmarks,
      imageSource: video,
      blurPx: 18
    });

    renderResultsToTargets(results, {
      maskCanvas,
      subtleCanvas,
      moderateCanvas,
      extremeCanvas
    });

    setStatus('Preview ready');
  } catch (error) {
    console.error('Simulation failed:', error);
    setStatus('Simulation failed');
  } finally {
    setGenerateButtonLoading(false);
  }
}

export function open3DViewer() {
  const mappedProcedure = getViewerProcedure(currentProcedure);
  window.location.href = `viewer.html?procedure=${mappedProcedure}`;
}

window.open3DViewer = open3DViewer
