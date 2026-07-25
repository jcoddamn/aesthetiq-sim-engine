import { getProcedureMask } from './mediapipeMasks.js';
import { createFeatheredMask } from './maskUtils.js';
import { applyTreatmentEffect } from './treatmentEffects.js';

export function imageToCanvas(imageSource) {
  const canvas = document.createElement('canvas');

  const width = imageSource.videoWidth || imageSource.naturalWidth || imageSource.width;
  const height = imageSource.videoHeight || imageSource.naturalHeight || imageSource.height;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageSource, 0, 0, width, height);

  return canvas;
}

export function generateMaskCanvas(procedure, landmarks, width, height, blurPx = 18) {
  const polygons = getProcedureMask(procedure, landmarks, width, height);
  if (!polygons || polygons.length === 0) return null;

  const procedureBlur =
    procedure === 'glabella' ? 5 :
    procedure === 'lipFiller' || procedure === 'lipFlip' ? 10 :
    procedure === 'crowsfeet' ? 12 :
    procedure === 'foreheadBotox' ? 18 :
    blurPx;

  return createFeatheredMask(width, height, polygons, procedureBlur);
}

export function runProcedureSimulation({ procedure, landmarks, sourceCanvas, blurPx = 18 }) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const maskCanvas = generateMaskCanvas(procedure, landmarks, width, height, blurPx);

  if (!maskCanvas) {
    return {
      maskCanvas: null,
      subtleCanvas: sourceCanvas,
      moderateCanvas: sourceCanvas,
      extremeCanvas: sourceCanvas
    };
  }

  return {
    maskCanvas,
    subtleCanvas: applyTreatmentEffect(procedure, sourceCanvas, maskCanvas, 'subtle'),
    moderateCanvas: applyTreatmentEffect(procedure, sourceCanvas, maskCanvas, 'moderate'),
    extremeCanvas: applyTreatmentEffect(procedure, sourceCanvas, maskCanvas, 'extreme')
  };
}

export function runProcedureSimulationFromImage({ procedure, landmarks, imageSource, blurPx = 18 }) {
  const sourceCanvas = imageToCanvas(imageSource);
  return runProcedureSimulation({ procedure, landmarks, sourceCanvas, blurPx });
}

export function renderCanvasToElement(canvas, targetCanvas) {
  if (!canvas || !targetCanvas) return;

  targetCanvas.width = canvas.width;
  targetCanvas.height = canvas.height;

  const ctx = targetCanvas.getContext('2d');
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  ctx.drawImage(canvas, 0, 0);
}

export function renderResultsToTargets(results, targets = {}) {
  if (targets.maskCanvas && results.maskCanvas) {
    renderCanvasToElement(results.maskCanvas, targets.maskCanvas);
  }
  if (targets.subtleCanvas && results.subtleCanvas) {
    renderCanvasToElement(results.subtleCanvas, targets.subtleCanvas);
  }
  if (targets.moderateCanvas && results.moderateCanvas) {
    renderCanvasToElement(results.moderateCanvas, targets.moderateCanvas);
  }
  if (targets.extremeCanvas && results.extremeCanvas) {
    renderCanvasToElement(results.extremeCanvas, targets.extremeCanvas);
  }
}

// =========================================================
// PROCEDURE-TO-MASK MAPPING
// Supports database IDs and older cameraProcedure IDs.
// =========================================================

export const PROCEDURE_MASK_MAP = {
  // Fillers and lip procedures
  "lip-filler": ["upperLip", "lowerLip"],
  lipFiller: ["upperLip", "lowerLip"],

  "lip-flip": ["upperLip", "philtrum"],
  lipFlip: ["upperLip", "philtrum"],

  "under-eye-filler": [
    "leftUnderEye",
    "rightUnderEye"
  ],
  underEyeFiller: [
    "leftUnderEye",
    "rightUnderEye"
  ],

  "cheek-filler": [
    "leftCheek",
    "rightCheek"
  ],
  cheekFiller: [
    "leftCheek",
    "rightCheek"
  ],

  "chin-filler": ["chin"],
  chinFiller: ["chin"],

  "chin-implant": ["chin"],
  chinImplant: ["chin"],

  "jawline-filler": [
    "leftJawline",
    "rightJawline",
    "chin"
  ],
  jawlineFiller: [
    "leftJawline",
    "rightJawline",
    "chin"
  ],

  "temple-filler": [
    "leftTemple",
    "rightTemple"
  ],
  templeFiller: [
    "leftTemple",
    "rightTemple"
  ],

  // Nose
  rhinoplasty: [
    "noseBridge",
    "noseTip",
    "leftNostril",
    "rightNostril"
  ],

  "revision-rhinoplasty": [
    "noseBridge",
    "noseTip",
    "leftNostril",
    "rightNostril"
  ],

  // Neuromodulators
  "forehead-neuromodulator": ["forehead"],
  foreheadBotox: ["forehead"],

  "glabella-neuromodulator": ["glabella"],
  glabellaBotox: ["glabella"],
  glabella: ["glabella"],

  "crows-feet-neuromodulator": [
    "leftCrowsFeet",
    "rightCrowsFeet"
  ],
  crowsFeetBotox: [
    "leftCrowsFeet",
    "rightCrowsFeet"
  ],
  crowsfeet: [
    "leftCrowsFeet",
    "rightCrowsFeet"
  ],

  // Facial surgery
  "buccal-fat-removal": [
    "leftBuccalArea",
    "rightBuccalArea"
  ],
  buccalFatRemoval: [
    "leftBuccalArea",
    "rightBuccalArea"
  ],

  facelift: [
    "leftCheek",
    "rightCheek",
    "leftJawline",
    "rightJawline",
    "lowerFace"
  ],

  "mini-facelift": [
    "leftCheek",
    "rightCheek",
    "leftJawline",
    "rightJawline"
  ],

  "brow-lift": [
    "leftBrow",
    "rightBrow",
    "forehead"
  ],
  browLift: [
    "leftBrow",
    "rightBrow",
    "forehead"
  ],

  "upper-blepharoplasty": [
    "leftUpperEyelid",
    "rightUpperEyelid"
  ],
  upperBlepharoplasty: [
    "leftUpperEyelid",
    "rightUpperEyelid"
  ],

  "lower-blepharoplasty": [
    "leftUnderEye",
    "rightUnderEye"
  ],
  lowerBlepharoplasty: [
    "leftUnderEye",
    "rightUnderEye"
  ],

  "lip-lift": [
    "upperLip",
    "philtrum",
    "cupidsBow"
  ],
  lipLift: [
    "upperLip",
    "philtrum",
    "cupidsBow"
  ],

  // Skin
  "chemical-peel": ["fullFace"],
  chemicalPeel: ["fullFace"],

  "laser-resurfacing": ["fullFace"],
  microneedling: ["fullFace"],
  "rf-microneedling": ["fullFace"],
  ipl: ["fullFace"],
  "co2-laser": ["fullFace"],

  // Smile
  veneers: ["teeth"],
  "dental-bonding": ["teeth"],
  dentalBonding: ["teeth"],

  "teeth-whitening": ["teeth"],
  teethWhitening: ["teeth"],

  "gum-contouring": ["gums"],
  gumContouring: ["gums"]
};

export function getMaskNamesForProcedure(procedureId) {
  return PROCEDURE_MASK_MAP[procedureId] || [];
}

export function getProcedureMask(
  procedureId,
  landmarks,
  canvasWidth,
  canvasHeight,
  mirrorX = false
) {
  const maskNames =
    getMaskNamesForProcedure(procedureId);

  if (maskNames.length === 0) {
    console.warn(
      `[AesthetIQ] No masks mapped for procedure: ${procedureId}`
    );

    return [];
  }

  return maskNames.flatMap((maskName) =>
    getMaskPolygons(
      maskName,
      landmarks,
      canvasWidth,
      canvasHeight,
      mirrorX
    )
  );
}
