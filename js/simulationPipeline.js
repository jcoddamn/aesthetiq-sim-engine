// =========================================================
// AESTHETIQ — SIMULATION PIPELINE
// File: js/simulationPipeline.js
// =========================================================

import {
  getProcedureMask,
  normalizeProcedureId
} from "./procedureMap.js";

import {
  createFeatheredMask
} from "./maskUtils.js";

import {
  applyTreatmentEffect
} from "./treatmentEffects.js";

import {
  createMaskDebugCanvas
} from "./maskDebugger.js";

// Turn this off before production release.
let DEBUG_MASKS = true;

// ---------------------------------------------------------
// DEBUG CONTROL
// ---------------------------------------------------------

export function setMaskDebugEnabled(
  enabled
) {
  DEBUG_MASKS = Boolean(enabled);
}

export function isMaskDebugEnabled() {
  return DEBUG_MASKS;
}

// ---------------------------------------------------------
// IMAGE → CANVAS
// ---------------------------------------------------------

export function imageToCanvas(
  imageSource
) {
  if (!imageSource) {
    throw new Error(
      "imageToCanvas requires an image or video source."
    );
  }

  const width =
    imageSource.videoWidth ||
    imageSource.naturalWidth ||
    imageSource.width;

  const height =
    imageSource.videoHeight ||
    imageSource.naturalHeight ||
    imageSource.height;

  if (!width || !height) {
    throw new Error(
      "The image source does not have valid dimensions."
    );
  }

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Could not create a 2D canvas context."
    );
  }

  context.drawImage(
    imageSource,
    0,
    0,
    width,
    height
  );

  return canvas;
}

// ---------------------------------------------------------
// PROCEDURE BLUR
// ---------------------------------------------------------

function getProcedureBlur(
  normalizedProcedure,
  defaultBlur
) {
  if (
    normalizedProcedure ===
    "glabella-neuromodulator"
  ) {
    return 5;
  }

  if (
    [
      "lip-filler",
      "lip-flip"
    ].includes(normalizedProcedure)
  ) {
    return 10;
  }

  if (
    normalizedProcedure ===
    "crows-feet-neuromodulator"
  ) {
    return 12;
  }

  if (
    normalizedProcedure ===
    "forehead-neuromodulator"
  ) {
    return 18;
  }

  if (
    [
      "rhinoplasty",
      "revision-rhinoplasty"
    ].includes(normalizedProcedure)
  ) {
    return 8;
  }

  if (
    [
      "cheek-filler",
      "cheek-implants",
      "buccal-fat-removal"
    ].includes(normalizedProcedure)
  ) {
    return 16;
  }

  return defaultBlur;
}

// ---------------------------------------------------------
// MASK DATA
// ---------------------------------------------------------

export function generateMaskData(
  procedure,
  landmarks,
  width,
  height,
  options = {}
) {
  const {
    blurPx = 18,
    mirrorX = false
  } = options;

  const normalizedProcedure =
    normalizeProcedureId(procedure);

  const polygons = getProcedureMask(
    normalizedProcedure,
    landmarks,
    width,
    height,
    mirrorX
  );

  if (
    !Array.isArray(polygons) ||
    polygons.length === 0
  ) {
    console.warn(
      `[AesthetIQ] No mask polygons generated for: ${normalizedProcedure}`
    );

    return {
      normalizedProcedure,
      polygons: [],
      maskCanvas: null
    };
  }

  const procedureBlur =
    getProcedureBlur(
      normalizedProcedure,
      blurPx
    );

  const maskCanvas =
    createFeatheredMask(
      width,
      height,
      polygons,
      procedureBlur
    );

  return {
    normalizedProcedure,
    polygons,
    maskCanvas
  };
}

// Keep this function available for older code that expects
// generateMaskCanvas() to return only the mask canvas.
export function generateMaskCanvas(
  procedure,
  landmarks,
  width,
  height,
  blurPx = 18,
  mirrorX = false
) {
  const result =
    generateMaskData(
      procedure,
      landmarks,
      width,
      height,
      {
        blurPx,
        mirrorX
      }
    );

  return result.maskCanvas;
}

// ---------------------------------------------------------
// COPY CANVAS
// ---------------------------------------------------------

function copyCanvas(sourceCanvas) {
  if (!sourceCanvas) {
    return null;
  }

  const copiedCanvas =
    document.createElement("canvas");

  copiedCanvas.width =
    sourceCanvas.width;

  copiedCanvas.height =
    sourceCanvas.height;

  const context =
    copiedCanvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.drawImage(
    sourceCanvas,
    0,
    0
  );

  return copiedCanvas;
}

// ---------------------------------------------------------
// MAIN SIMULATION
// ---------------------------------------------------------

export function runProcedureSimulation({
  procedure,
  landmarks,
  sourceCanvas,
  blurPx = 18,
  mirrorX = false
}) {
  if (!sourceCanvas) {
    throw new Error(
      "runProcedureSimulation requires sourceCanvas."
    );
  }

  const width =
    sourceCanvas.width;

  const height =
    sourceCanvas.height;

  const {
    normalizedProcedure,
    polygons,
    maskCanvas
  } = generateMaskData(
    procedure,
    landmarks,
    width,
    height,
    {
      blurPx,
      mirrorX
    }
  );

  const debugCanvas =
    DEBUG_MASKS
      ? createMaskDebugCanvas(
          sourceCanvas,
          polygons,
          {
            drawPoints: true,
            drawFill: true,
            drawStroke: true
          }
        )
      : null;

  if (!maskCanvas) {
    return {
      procedure:
        normalizedProcedure,

      polygons: [],

      maskCanvas: null,

      debugCanvas:
        debugCanvas ||
        copyCanvas(sourceCanvas),

      subtleCanvas:
        copyCanvas(sourceCanvas),

      moderateCanvas:
        copyCanvas(sourceCanvas),

      extremeCanvas:
        copyCanvas(sourceCanvas)
    };
  }

  /*
   * We still pass the original procedure value into
   * applyTreatmentEffect for compatibility with your
   * current treatmentEffects.js file.
   *
   * Later, we can standardize treatmentEffects.js to use
   * only normalized procedure IDs.
   */

  return {
    procedure:
      normalizedProcedure,

    polygons,
    maskCanvas,
    debugCanvas,

    subtleCanvas:
      applyTreatmentEffect(
        procedure,
        sourceCanvas,
        maskCanvas,
        "subtle"
      ),

    moderateCanvas:
      applyTreatmentEffect(
        procedure,
        sourceCanvas,
        maskCanvas,
        "moderate"
      ),

    extremeCanvas:
      applyTreatmentEffect(
        procedure,
        sourceCanvas,
        maskCanvas,
        "extreme"
      )
  };
}

// ---------------------------------------------------------
// RUN FROM IMAGE OR VIDEO
// ---------------------------------------------------------

export function runProcedureSimulationFromImage({
  procedure,
  landmarks,
  imageSource,
  blurPx = 18,
  mirrorX = false
}) {
  const sourceCanvas =
    imageToCanvas(imageSource);

  return runProcedureSimulation({
    procedure,
    landmarks,
    sourceCanvas,
    blurPx,
    mirrorX
  });
}

// ---------------------------------------------------------
// CANVAS RENDERING
// ---------------------------------------------------------

export function renderCanvasToElement(
  canvas,
  targetCanvas
) {
  if (!canvas || !targetCanvas) {
    return;
  }

  targetCanvas.width =
    canvas.width;

  targetCanvas.height =
    canvas.height;

  const context =
    targetCanvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(
    0,
    0,
    targetCanvas.width,
    targetCanvas.height
  );

  context.drawImage(
    canvas,
    0,
    0
  );
}

// ---------------------------------------------------------
// RESULT RENDERING
// ---------------------------------------------------------

export function renderResultsToTargets(
  results,
  targets = {}
) {
  if (!results) {
    return;
  }

  if (
    targets.maskCanvas &&
    results.maskCanvas
  ) {
    renderCanvasToElement(
      results.maskCanvas,
      targets.maskCanvas
    );
  }

  if (
    targets.debugCanvas &&
    results.debugCanvas
  ) {
    renderCanvasToElement(
      results.debugCanvas,
      targets.debugCanvas
    );
  }

  if (
    targets.subtleCanvas &&
    results.subtleCanvas
  ) {
    renderCanvasToElement(
      results.subtleCanvas,
      targets.subtleCanvas
    );
  }

  if (
    targets.moderateCanvas &&
    results.moderateCanvas
  ) {
    renderCanvasToElement(
      results.moderateCanvas,
      targets.moderateCanvas
    );
  }

  if (
    targets.extremeCanvas &&
    results.extremeCanvas
  ) {
    renderCanvasToElement(
      results.extremeCanvas,
      targets.extremeCanvas
    );
  }
}
