import {
  startFaceTracking,
  stopFaceTracking
} from "./mediapipeRunner.js";

import {
  runProcedureSimulationFromImage,
  renderCanvasToElement,
  renderResultsToTargets
} from "./simulationPipeline.js";

import {
  getProcedureLabel,
  getViewerProcedure,
  getProcedureMask,
  getProcedureColor,
  normalizeProcedureId
} from "./procedureMap.js";

import {
  getProcedureById
} from "./procedureData.js";

import {
  drawPolygonOutline
} from "./maskUtils.js";

import {
  createLandmarkSmoother
} from "./landmarkSmoothing.js";

import {
  createMultiAngleCapture
} from "./multiAngleCapture.js";

// =========================================================
// CONFIGURATION
// =========================================================

const DEBUG_MODE = false;

const params =
  new URLSearchParams(window.location.search);

const requestedProcedure =
  params.get("procedure") ||
  "under-eye-filler";

const selectedOption =
  params.get("option") ||
  "standard-treatment";

let currentProcedure =
  normalizeProcedureId(requestedProcedure);

let latestLandmarks = null;
let capturedCanvas = null;
let simulationResults = null;
let selectedLevel = "balanced";
let viewingOriginal = false;

const smoothLandmarks =
  createLandmarkSmoother(0.75);

// =========================================================
// ELEMENTS
// =========================================================

const video =
  document.getElementById("camera");

const cameraPreview =
  document.getElementById("cameraPreview");

const resultCanvas =
  document.getElementById("resultCanvas");

const naturalCanvas =
  document.getElementById("naturalResult");

const balancedCanvas =
  document.getElementById("balancedResult");

const enhancedCanvas =
  document.getElementById("enhancedResult");

const maskCanvas =
  document.getElementById("maskPreview");

const debugCanvas =
  document.getElementById("debugPreview");

const selectedProcedureElement =
  document.getElementById("selectedProcedure");

const selectedTreatmentElement =
  document.getElementById("selectedTreatment");

const selectedRecoveryElement =
  document.getElementById("selectedRecovery");

const trackingStatus =
  document.getElementById("trackingStatus");

const statusPill =
  document.getElementById("statusPill");

const guideMessage =
  document.getElementById("guideMessage");

const faceCheck =
  document.getElementById("faceCheck");

const centerCheck =
  document.getElementById("centerCheck");

const lightingCheck =
  document.getElementById("lightingCheck");

const captureButton =
  document.getElementById("captureButton");

const retakeButton =
  document.getElementById("retakeButton");

const uploadButton =
  document.getElementById("uploadButton");

const photoUpload =
  document.getElementById("photoUpload");

const resultsSection =
  document.getElementById("resultsSection");

const resultLabel =
  document.getElementById("resultLabel");

const showOriginalButton =
  document.getElementById("showOriginalButton");

const showSimulationButton =
  document.getElementById(
    "showSimulationButton"
  );

const saveSimulationButton =
  document.getElementById(
    "saveSimulationButton"
  );

const viewerButton =
  document.getElementById("viewerButton");

const backButton =
  document.getElementById("backButton");

const changeProcedureButton =
  document.getElementById(
    "changeProcedureButton"
  );

const developmentTools =
  document.getElementById(
    "developmentTools"
  );

const TREATMENT_OPTION_LABELS = {
  "hyaluronic-acid":
    "Hyaluronic Acid Filler",

  juvederm:
    "Juvéderm",

  "restylane-kysse":
    "Restylane Kysse",

  rha:
    "RHA Collection",

  prf:
    "PRF",

  "fat-transfer":
    "Fat Transfer",

  "fat-grafting":
    "Fat Grafting",

  botox:
    "Botox",

  dysport:
    "Dysport",

  xeomin:
    "Xeomin",

  jeuveau:
    "Jeuveau",

  daxxify:
    "Daxxify",

  silicone:
    "Silicone Gel Implant",

  saline:
    "Saline Implant",

  "silicone-implant":
    "Silicone Implant",

  "porous-polyethylene":
    "Porous Polyethylene Implant",

  "septal-cartilage":
    "Septal Cartilage",

  "ear-cartilage":
    "Ear Cartilage",

  "rib-cartilage":
    "Rib Cartilage",

  "glycolic-acid":
    "Glycolic Acid Peel",

  "lactic-acid":
    "Lactic Acid Peel",

  "salicylic-acid":
    "Salicylic Acid Peel",

  tca:
    "TCA Peel",

  phenol:
    "Phenol Peel",

  "autologous-fat":
    "Your Own Body Fat",

  "standard-treatment":
    "Standard Treatment"
};

const precisionScanButton =
  document.getElementById(
    "precisionScanButton"
  );

const precisionScanPanel =
  document.getElementById(
    "precisionScanPanel"
  );

const precisionInstruction =
  document.getElementById(
    "precisionInstruction"
  );

const straightPoseStep =
  document.getElementById(
    "straightPoseStep"
  );

const leftPoseStep =
  document.getElementById(
    "leftPoseStep"
  );

const rightPoseStep =
  document.getElementById(
    "rightPoseStep"
  );

const poseHoldProgress =
  document.getElementById(
    "poseHoldProgress"
  );

const precisionCapture =
  createMultiAngleCapture({
    stableFrameTarget: 12,
    minimumConfidence: 0.58,

    onUpdate:
      updatePrecisionScanUI,

    onPoseCaptured:
      ({ pose }) => {
        setStatus(
          `${capitalize(pose)} angle captured`,
          "ready"
        );
      },

    onComplete:
      handlePrecisionScanComplete
  });

// =========================================================
// INITIALIZATION
// =========================================================

initApp();

function initApp() {
  if (!video || !cameraPreview) {
    setStatus(
      "Camera elements missing",
      "error"
    );

    return;
  }

  updateProcedureInformation();
  bindControls();

  if (DEBUG_MODE) {
    developmentTools?.classList.add(
      "visible"
    );
  }

  setStatus(
    "Starting camera…",
    "loading"
  );

  startFaceTracking(
    video,

    (landmarks) => {
  latestLandmarks =
    smoothLandmarks(landmarks);

  updateCameraReadiness();

  if (
    precisionCapture.isActive()
  ) {
    precisionCapture.processFrame({
      landmarks:
        latestLandmarks,

      videoElement:
        video
    });
  }
},

    (statusText) => {
      const normalizedStatus =
        String(statusText || "");

      if (
        normalizedStatus
          .toLowerCase()
          .includes("denied") ||
        normalizedStatus
          .toLowerCase()
          .includes("error")
      ) {
        setStatus(
          normalizedStatus,
          "error"
        );

        return;
      }

      setStatus(
        normalizedStatus,
        latestLandmarks
          ? "ready"
          : "loading"
      );
    }
  );

  startPreviewLoop();
}

// =========================================================
function updateProcedureInformation() {
  const procedureData =
    getProcedureById(currentProcedure);

  if (selectedProcedureElement) {
    selectedProcedureElement.textContent =
      procedureData?.name ||
      getProcedureLabel(currentProcedure);
  }

  if (selectedTreatmentElement) {
    selectedTreatmentElement.textContent =
      getSelectedTreatmentLabel(
        selectedOption
      );
  }

  if (selectedRecoveryElement) {
    selectedRecoveryElement.textContent =
      procedureData?.recovery ||
      "Recovery varies depending on the treatment plan.";
  }
}

function getSelectedTreatmentLabel(option) {
  const normalizedOption =
    String(option || "")
      .trim()
      .toLowerCase();

  if (
    TREATMENT_OPTION_LABELS[
      normalizedOption
    ]
  ) {
    return TREATMENT_OPTION_LABELS[
      normalizedOption
    ];
  }

  return normalizedOption
    .split("-")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}
// =========================================================
// CONTROLS
// =========================================================

function bindControls() {
  captureButton?.addEventListener(
    "click",
    captureAndGenerate
  );

  retakeButton?.addEventListener(
    "click",
    resetSimulation
  );

  uploadButton?.addEventListener(
    "click",
    () => photoUpload?.click()
  );

  photoUpload?.addEventListener(
  "change",
  handlePhotoUpload
);

precisionScanButton?.addEventListener(
  "click",
  togglePrecisionScan
);
    
  document
    .querySelectorAll(
      ".intensity-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          selectedLevel =
            button.dataset.level ||
            "balanced";

          updateIntensityButtons();
          viewingOriginal = false;
          updateCompareButtons();
          renderSelectedResult();
        }
      );
    });

  showOriginalButton?.addEventListener(
    "click",
    () => {
      viewingOriginal = true;
      updateCompareButtons();
      renderSelectedResult();
    }
  );

  showSimulationButton?.addEventListener(
    "click",
    () => {
      viewingOriginal = false;
      updateCompareButtons();
      renderSelectedResult();
    }
  );

  viewerButton?.addEventListener(
    "click",
    open3DViewer
  );

  saveSimulationButton?.addEventListener(
    "click",
    saveCurrentSimulation
  );

  backButton?.addEventListener(
    "click",
    () => {
      history.back();
    }
  );

  changeProcedureButton?.addEventListener(
    "click",
    () => {
      window.location.href =
        "procedures.html";
    }
  );
}

function togglePrecisionScan() {
  if (

alert("Precision Scan button works!");
    
    precisionCapture.isActive()
  ) {
    precisionCapture.stop();

    if (precisionScanButton) {
      precisionScanButton.textContent =
        "Start Precision Scan";
    }

    return;
  }

  resetSimulation();

  precisionScanPanel?.removeAttribute(
    "hidden"
  );

  if (precisionScanButton) {
    precisionScanButton.textContent =
      "Stop Precision Scan";
  }

  precisionCapture.start();

  setStatus(
    "Precision scan started",
    "loading"
  );
}

function updatePrecisionScanUI(
  progress
) {
  const {
    currentPose,
    completedPoses = [],
    stableFrameCount = 0,
    stableFrameTarget = 12,
    instruction = ""
  } = progress;

  if (precisionInstruction) {
    precisionInstruction.textContent =
      instruction;
  }

  const steps = {
    straight:
      straightPoseStep,

    left:
      leftPoseStep,

    right:
      rightPoseStep
  };

  Object.entries(steps).forEach(
    ([pose, element]) => {
      element?.classList.toggle(
        "current",
        pose === currentPose
      );

      element?.classList.toggle(
        "complete",
        completedPoses.includes(
          pose
        )
      );
    }
  );

  const progressPercent =
    stableFrameTarget > 0
      ? Math.min(
          100,
          (
            stableFrameCount /
            stableFrameTarget
          ) * 100
        )
      : 0;

  if (poseHoldProgress) {
    poseHoldProgress.style.width =
      `${progressPercent}%`;
  }
}

function handlePrecisionScanComplete(
  captures
) {
  if (precisionScanButton) {
    precisionScanButton.textContent =
      "Start Precision Scan";
  }

  if (precisionInstruction) {
    precisionInstruction.textContent =
      "Precision scan complete";
  }

  if (poseHoldProgress) {
    poseHoldProgress.style.width =
      "100%";
  }

  const straightCapture =
    captures?.straight;

  if (
    !straightCapture?.imageCanvas ||
    !straightCapture?.landmarks
  ) {
    setStatus(
      "Precision scan could not be completed",
      "error"
    );

    return;
  }

  /*
   * For this first integration, the straight capture
   * drives the existing 2D simulation.
   *
   * The next phase will combine straight, left, and
   * right landmark measurements before simulation.
   */
  capturedCanvas =
    straightCapture.imageCanvas;

  generateSimulation(
    straightCapture.imageCanvas,
    straightCapture.landmarks
  );
}

// =========================================================
// CAMERA PREVIEW
// =========================================================

function startPreviewLoop() {
  function loop() {
    drawCameraPreview();
    requestAnimationFrame(loop);
  }

  loop();
}

function drawCameraPreview() {
  if (
    !video ||
    !cameraPreview ||
    !video.videoWidth ||
    !video.videoHeight
  ) {
    return;
  }

  cameraPreview.width =
    video.videoWidth;

  cameraPreview.height =
    video.videoHeight;

  const context =
    cameraPreview.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(
    0,
    0,
    cameraPreview.width,
    cameraPreview.height
  );

  context.save();

  context.translate(
    cameraPreview.width,
    0
  );

  context.scale(-1, 1);

  context.drawImage(
    video,
    0,
    0,
    cameraPreview.width,
    cameraPreview.height
  );

  context.restore();

  if (
    DEBUG_MODE &&
    latestLandmarks
  ) {
    drawSelectedProcedureRegion(
      latestLandmarks
    );
  }
}

function drawSelectedProcedureRegion(
  landmarks
) {
  const polygons =
    getProcedureMask(
      currentProcedure,
      landmarks,
      cameraPreview.width,
      cameraPreview.height,
      true
    );

  if (!polygons?.length) {
    return;
  }

  const context =
    cameraPreview.getContext("2d");

  const color =
    getProcedureColor(currentProcedure);

  polygons.forEach((polygon) => {
    drawPolygonOutline(
      context,
      polygon,
      color,
      2
    );
  });
}

// =========================================================
// CAMERA READINESS
// =========================================================

function updateCameraReadiness() {
  const hasFace =
    Array.isArray(latestLandmarks) &&
    latestLandmarks.length >= 468;

  faceCheck?.classList.toggle(
    "active",
    hasFace
  );

  const centered =
    hasFace &&
    isFaceCentered(latestLandmarks);

  centerCheck?.classList.toggle(
    "active",
    centered
  );

  const lightingGood =
    hasFace &&
    isLightingAcceptable();

  lightingCheck?.classList.toggle(
    "active",
    lightingGood
  );

  if (captureButton) {
    captureButton.disabled =
      !hasFace;
  }

  if (!hasFace) {
    guideMessage.textContent =
      "Center your face inside the guide";

    return;
  }

  if (!centered) {
    guideMessage.textContent =
      "Move slightly toward the center";

    return;
  }

  if (!lightingGood) {
    guideMessage.textContent =
      "Use brighter, more even lighting";

    return;
  }

  guideMessage.textContent =
    "Ready to capture";

  setStatus(
    "Face ready",
    "ready"
  );
}

function isFaceCentered(landmarks) {
  const noseTip =
    landmarks?.[1];

  if (!noseTip) {
    return false;
  }

  return (
    noseTip.x > 0.36 &&
    noseTip.x < 0.64 &&
    noseTip.y > 0.24 &&
    noseTip.y < 0.72
  );
}

function isLightingAcceptable() {
  if (
    !cameraPreview ||
    !cameraPreview.width ||
    !cameraPreview.height
  ) {
    return false;
  }

  try {
    const context =
      cameraPreview.getContext("2d");

    const sampleWidth =
      Math.min(
        60,
        cameraPreview.width
      );

    const sampleHeight =
      Math.min(
        60,
        cameraPreview.height
      );

    const sampleX =
      Math.max(
        0,
        Math.floor(
          cameraPreview.width / 2 -
          sampleWidth / 2
        )
      );

    const sampleY =
      Math.max(
        0,
        Math.floor(
          cameraPreview.height / 2 -
          sampleHeight / 2
        )
      );

    const pixels =
      context.getImageData(
        sampleX,
        sampleY,
        sampleWidth,
        sampleHeight
      ).data;

    let totalBrightness = 0;

    for (
      let index = 0;
      index < pixels.length;
      index += 4
    ) {
      totalBrightness +=
        (
          pixels[index] +
          pixels[index + 1] +
          pixels[index + 2]
        ) / 3;
    }

    const pixelCount =
      pixels.length / 4;

    const averageBrightness =
      totalBrightness / pixelCount;

    return (
      averageBrightness > 45 &&
      averageBrightness < 230
    );
  } catch (error) {
    return true;
  }
}

// =========================================================
// CAPTURE AND SIMULATION
// =========================================================

function captureAndGenerate() {
  if (!latestLandmarks) {
    setStatus(
      "No face detected",
      "error"
    );

    return;
  }

  if (
    !video.videoWidth ||
    !video.videoHeight
  ) {
    setStatus(
      "Camera not ready",
      "error"
    );

    return;
  }

  capturedCanvas =
    captureCurrentVideoFrame();

  generateSimulation(
    capturedCanvas,
    latestLandmarks
  );
}

function captureCurrentVideoFrame() {
  const canvas =
    document.createElement("canvas");

  canvas.width =
    video.videoWidth;

  canvas.height =
    video.videoHeight;

  const context =
    canvas.getContext("2d");

  context.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas;
}

function generateSimulation(
  imageSource,
  landmarks
) {
  try {
    setCaptureLoading(true);

    setStatus(
      "Generating preview…",
      "loading"
    );

    simulationResults =
      runProcedureSimulationFromImage({
        procedure:
          currentProcedure,

        landmarks,

        imageSource,

        blurPx: 18,

        mirrorX: false
      });

    renderResultsToTargets(
      simulationResults,
      {
        maskCanvas,
        debugCanvas,
        naturalCanvas,
        balancedCanvas,
        enhancedCanvas
      }
    );

    resultsSection?.classList.add(
      "visible"
    );

    selectedLevel =
      "balanced";

    viewingOriginal = false;

    updateIntensityButtons();
    updateCompareButtons();
    renderSelectedResult();

    setStatus(
      "Preview ready",
      "ready"
    );

    resultsSection?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    } catch (error) {
    console.error(
      "Simulation failed:",
      error
    );

    const message =
      error?.message ||
      String(error);

    setStatus(
      `Simulation failed: ${message}`,
      "error"
    );
  } finally {
    setCaptureLoading(false);
  }
}

// =========================================================
// RESULT DISPLAY
// =========================================================

function renderSelectedResult() {
  if (
    !resultCanvas ||
    !capturedCanvas
  ) {
    return;
  }

  if (viewingOriginal) {
    renderCanvasToElement(
      capturedCanvas,
      resultCanvas
    );

    if (resultLabel) {
      resultLabel.textContent =
        "Original";
    }

    return;
  }

  const selectedCanvas =
    getSelectedResultCanvas();

  if (!selectedCanvas) {
    return;
  }

  renderCanvasToElement(
    selectedCanvas,
    resultCanvas
  );

  if (resultLabel) {
    resultLabel.textContent =
      capitalize(selectedLevel);
  }
}

function getSelectedResultCanvas() {
  if (!simulationResults) {
    return null;
  }

  if (selectedLevel === "natural") {
    return simulationResults.naturalCanvas;
  }

  if (selectedLevel === "enhanced") {
    return simulationResults.enhancedCanvas;
  }

  return simulationResults.balancedCanvas;
}

function updateIntensityButtons() {
  document
    .querySelectorAll(
      ".intensity-button"
    )
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.level ===
          selectedLevel
      );
    });
}

function updateCompareButtons() {
  showOriginalButton?.classList.toggle(
    "active",
    viewingOriginal
  );

  showSimulationButton?.classList.toggle(
    "active",
    !viewingOriginal
  );
}

// =========================================================
// RESET
// =========================================================

function resetSimulation() {
  capturedCanvas = null;
  simulationResults = null;
  viewingOriginal = false;

  resultsSection?.classList.remove(
    "visible"
  );

  [
    resultCanvas,
    maskCanvas,
    debugCanvas,
    naturalCanvas,
    balancedCanvas,
    enhancedCanvas
  ].forEach((canvas) => {
    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext("2d");

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  });

  setStatus(
    latestLandmarks
      ? "Face ready"
      : "Searching for face…",
    latestLandmarks
      ? "ready"
      : "loading"
  );
}

// =========================================================
// PHOTO UPLOAD
// =========================================================

function handlePhotoUpload(event) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  const image = new Image();

  image.onload = () => {
    capturedCanvas =
      document.createElement("canvas");

    capturedCanvas.width =
      image.naturalWidth;

    capturedCanvas.height =
      image.naturalHeight;

    const context =
      capturedCanvas.getContext("2d");

    context.drawImage(
      image,
      0,
      0
    );

    if (!latestLandmarks) {
      setStatus(
        "Face landmarks are needed. Use the live camera first.",
        "error"
      );

      return;
    }

    generateSimulation(
      capturedCanvas,
      latestLandmarks
    );

    URL.revokeObjectURL(
      image.src
    );
  };

  image.src =
    URL.createObjectURL(file);
}

// =========================================================
// SAVE AND VIEWER
// =========================================================

function saveCurrentSimulation() {
  const selectedCanvas =
    viewingOriginal
      ? capturedCanvas
      : getSelectedResultCanvas();

  if (!selectedCanvas) {
    setStatus(
      "Generate a preview first",
      "error"
    );

    return;
  }

  const link =
    document.createElement("a");

  const filename =
    [
      "aesthetiq",
      currentProcedure,
      viewingOriginal
        ? "original"
        : selectedLevel
    ].join("-");

  link.download =
    `${filename}.png`;

  link.href =
    selectedCanvas.toDataURL(
      "image/png"
    );

  link.click();

  setStatus(
    "Simulation saved",
    "ready"
  );
}

function open3DViewer() {
  const mappedProcedure =
    getViewerProcedure(
      currentProcedure
    );

  window.location.href =
    `viewer.html?procedure=${encodeURIComponent(
      mappedProcedure
    )}`;
}

// =========================================================
// UI HELPERS
// =========================================================

function setCaptureLoading(
  loading
) {
  if (!captureButton) {
    return;
  }

  captureButton.disabled =
    loading;

  captureButton.textContent =
    loading
      ? "Generating…"
      : "Capture Photo";
}

function setStatus(
  message,
  state = "loading"
) {
  if (trackingStatus) {
    trackingStatus.textContent =
      message;
  }

  statusPill?.classList.remove(
    "ready",
    "error"
  );

  if (state === "ready") {
    statusPill?.classList.add(
      "ready"
    );
  }

  if (state === "error") {
    statusPill?.classList.add(
      "error"
    );
  }
}

function capitalize(value) {
  const text =
    String(value || "");

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
}

// Stop camera tracks when leaving the page.
window.addEventListener(
  "beforeunload",
  () => {
    stopFaceTracking(video);
  }
);
