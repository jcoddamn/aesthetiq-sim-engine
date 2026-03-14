import { startFaceTracking } from './mediapipeRunner.js';
import {
  runProcedureSimulationFromImage,
  renderResultsToTargets
} from './simulationPipeline.js';

let latestLandmarks = null;
let currentProcedure = 'underEyeFiller';

const video = document.getElementById('camera');
const cameraPreview = document.getElementById('cameraPreview');

const maskCanvas = document.getElementById('maskPreview');
const subtleCanvas = document.getElementById('subtleResult');
const moderateCanvas = document.getElementById('moderateResult');
const extremeCanvas = document.getElementById('extremeResult');

const procedureLabel = document.getElementById('selectedProcedure');
const simulateButton = document.getElementById('simulateButton');

initApp();

function initApp() {
  if (!video) {
    console.error('Camera video element not found');
    return;
  }

  startFaceTracking(video, (landmarks) => {
    latestLandmarks = landmarks;
    drawCameraPreview();
  });

  if (simulateButton) {
    simulateButton.addEventListener('click', () => {
      runCurrentSimulation();
    });
  }

  updateProcedureLabel();
  startPreviewLoop();
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
}

export function setProcedure(procedureName) {
  currentProcedure = procedureName;
  updateProcedureLabel();
  console.log('Selected procedure:', currentProcedure);
}

function updateProcedureLabel() {
  if (procedureLabel) {
    procedureLabel.textContent = formatProcedureLabel(currentProcedure);
  }
}

function formatProcedureLabel(procedure) {
  const labels = {
    underEyeFiller: 'Under-Eye Fillers',
    laserEye: 'Laser Resurfacing',
    lipFiller: 'Lip Fillers',
    lipFlip: 'Lip Flip',
    foreheadBotox: 'Forehead Botox',
    glabella: '11 Lines',
    crowsfeet: "Crow's Feet",
    chemicalPeel: 'Chemical Peel'
  };

  return labels[procedure] || procedure;
}

export function runCurrentSimulation() {
  if (!latestLandmarks) {
    console.warn('No landmarks available yet');
    return;
  }

  try {
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

    console.log('Simulation complete for:', currentProcedure);
  } catch (error) {
    console.error('Simulation failed:', error);
  }
}

export function open3DViewer() {
  const procedureMap = {
    underEyeFiller: 'forehead',
    laserEye: 'forehead',
    lipFiller: 'lip',
    lipFlip: 'lip',
    foreheadBotox: 'forehead',
    glabella: 'glabella',
    crowsfeet: 'crowsfeet',
    chemicalPeel: 'forehead'
  };

  const mappedProcedure = procedureMap[currentProcedure] || 'forehead';

  const url = `viewer.html?procedure=${mappedProcedure}`;
  window.location.href = url;
}

window.setProcedure = setProcedure;
window.runCurrentSimulation = runCurrentSimulation;
window.open3DViewer = open3DViewer;
