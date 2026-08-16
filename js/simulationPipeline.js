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

import {
  warpLipFiller,
  warpChin,
  warpCheeks,
  warpJawline
} from "./faceWarp.js";

import {
  renderWarp,
  getFaceTriangles
} from "./warpRenderer.js";

import {
  MeshRenderer
} from "./meshRenderer.js";

import {
  applySoftTissueLighting
} from "./softTissueLighting.js";

import {
  getProcedureConstraints
} from "./procedureConstraints.js";

import {
  repairLowerLipTexture
} from "./lipTextureRepair.js";

const meshRenderer =
  new MeshRenderer();

meshRenderer.setTriangles(
  getFaceTriangles()
);

// Keep enabled while testing facial regions.
let DEBUG_MASKS = true;

// ---------------------------------------------------------
// DEBUG CONTROL
// ---------------------------------------------------------

export function setMaskDebugEnabled(enabled) {
  DEBUG_MASKS = Boolean(enabled);
}

export function isMaskDebugEnabled() {
  return DEBUG_MASKS;
}

// ---------------------------------------------------------
// IMAGE TO CANVAS
// ---------------------------------------------------------

export function imageToCanvas(imageSource) {
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
      "Could not create a canvas context."
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
// CANVAS COPY
// ---------------------------------------------------------

export function copyCanvas(sourceCanvas) {
  if (!sourceCanvas) {
    return null;
  }

  const canvas =
    document.createElement("canvas");

  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.drawImage(
    sourceCanvas,
    0,
    0
  );

  return canvas;
}

// ---------------------------------------------------------
// PROCEDURE BLUR
// ---------------------------------------------------------

function getProcedureBlur(
  normalizedProcedure,
  defaultBlur = 18
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

  if (
    [
      "chin-filler",
      "chin-implant",
      "jawline-filler"
    ].includes(normalizedProcedure)
  ) {
    return 14;
  }

  return defaultBlur;
}

// ---------------------------------------------------------
// GEOMETRY SUPPORT
// ---------------------------------------------------------

function usesGeometryWarp(procedure) {
  return [
    "lip-filler",
    "chin-filler",
    "chin-implant",
    "cheek-filler",
    "cheek-implants",
    "jawline-filler"
  ].includes(procedure);
}

function applyLandmarkConstraints(
  originalLandmarks,
  warpedLandmarks,
  constraints = {}
) {
  const maxHorizontalChange =
    Number(
      constraints.maxHorizontalChange
    ) || 0.04;

  const maxVerticalChange =
    Number(
      constraints.maxVerticalChange
    ) || 0.04;

  const maxProjectionChange =
    Number(
      constraints.maxProjectionChange
    ) || 0.04;

  return warpedLandmarks.map(
    (point, index) => {
      const original =
        originalLandmarks[index];

      if (!point || !original) {
        return point;
      }

      const deltaX =
        point.x - original.x;

      const deltaY =
        point.y - original.y;

      const originalZ =
        Number(original.z) || 0;

      const pointZ =
        Number(point.z);

      const deltaZ =
        Number.isFinite(pointZ)
          ? pointZ - originalZ
          : 0;

      return {
        ...point,

        x:
          original.x +
          Math.max(
            -maxHorizontalChange,
            Math.min(
              maxHorizontalChange,
              deltaX
            )
          ),

        y:
          original.y +
          Math.max(
            -maxVerticalChange,
            Math.min(
              maxVerticalChange,
              deltaY
            )
          ),

        z:
          originalZ +
          Math.max(
            -maxProjectionChange,
            Math.min(
              maxProjectionChange,
              deltaZ
            )
          )
      };
    }
  );
}

function createWarpedLandmarks(
  procedure,
  landmarks,
  level,
  anatomyProfile,
  tissueModel,
  constraints,
  lipStyle = "classic",
  lipProduct = "provider"
) {
  if (!Array.isArray(landmarks)) {
    return landmarks;
  }

  switch (procedure) {
  case "lip-filler": {
    const warped =
      warpLipFiller(
        landmarks,
        level,
        anatomyProfile?.anatomyStrength || 1,
        tissueModel,
        lipStyle,
        lipProduct
      );

    return applyLandmarkConstraints(
      landmarks,
      warped,
      constraints
    );
  }

  case "chin-filler":
  case "chin-implant":
    return warpChin(
      landmarks,
      level
    );

  case "cheek-filler":
  case "cheek-implants":
    return warpCheeks(
      landmarks,
      level
    );

  case "jawline-filler":
    return warpJawline(
      landmarks,
      level
    );

  default:
    return landmarks.map(
      landmark => ({
        ...landmark
      })
    );
}
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

  const polygons =
    getProcedureMask(
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

// Compatibility helper for older code.
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
// CREATE ONE SIMULATION LEVEL
// ---------------------------------------------------------

function createSimulationLevel({
  normalizedProcedure,
  level,
  landmarks,
  sourceCanvas,
  anatomyProfile,
  tissueModel,

  lipStyle = "classic",
  lipProduct = "provider",

  blurPx,
  mirrorX
}) {
  
  let workingLandmarks =
    landmarks;

  let workingCanvas =
    copyCanvas(sourceCanvas);

  if (
    usesGeometryWarp(
      normalizedProcedure
    )
  ) {
    const constraints =
  getProcedureConstraints({
    procedure:
      normalizedProcedure,

    level,

    anatomyProfile:
      anatomyProfile || {},

    tissueModel:
      tissueModel || {}
  });
    
   workingLandmarks =
  createWarpedLandmarks(
    normalizedProcedure,
    landmarks,
    level,
    anatomyProfile,
    tissueModel,
    constraints,
    lipStyle,
    lipProduct
  ); 

    if (
  normalizedProcedure ===
  "lip-filler"
) {
  console.log(
    "[AesthetIQ] LIP WARP TEST",
    {
      originalCount:
        landmarks?.length,

      warpedCount:
        workingLandmarks?.length
    }
  );

  workingCanvas =
    copyCanvas(sourceCanvas);

} else {
      workingCanvas =
        renderWarp(
          sourceCanvas,
          landmarks,
          workingLandmarks
        );
    }
  }

  const {
    polygons,
    maskCanvas
  } = generateMaskData(
    normalizedProcedure,
    workingLandmarks,
    workingCanvas.width,
    workingCanvas.height,
    {
      blurPx,
      mirrorX
    }
  );

  if (!maskCanvas) {
    return {
      canvas: workingCanvas,
      landmarks: workingLandmarks,
      polygons: [],
      maskCanvas: null
    };
  }

  let resultCanvas =
  applyTreatmentEffect(
    normalizedProcedure,
    workingCanvas,
    maskCanvas,
    level
  );

if (
  normalizedProcedure ===
  "lip-filler"
) {
  resultCanvas =
    applySoftTissueLighting(
      resultCanvas ||
        workingCanvas,
      maskCanvas,
      level
    );
}

return {
  canvas:
    resultCanvas ||
    workingCanvas,

  landmarks:
    workingLandmarks,

  polygons,
  maskCanvas
};
}

// ---------------------------------------------------------
// MAIN SIMULATION
// ---------------------------------------------------------

export function runProcedureSimulation({
  procedure,
  landmarks,
  sourceCanvas,
  anatomyProfile = null,
  tissueModel = null,

  lipStyle = "classic",
  lipProduct = "provider",

  blurPx = 18,
  mirrorX = false
}) {
  if (!sourceCanvas) {
    throw new Error(
      "runProcedureSimulation requires sourceCanvas."
    );
  }

  if (
    !Array.isArray(landmarks) ||
    landmarks.length < 468
  ) {
    throw new Error(
      `Invalid landmarks: ${
        landmarks?.length || 0
      }`
    );
  }

  const normalizedProcedure =
    normalizeProcedureId(procedure);

  const balancedResult =
    createSimulationLevel({
      normalizedProcedure,
      level: "balanced",
      landmarks,
      sourceCanvas,
      anatomyProfile,
      tissueModel,
      lipStyle,
      lipProduct,
      blurPx,
      mirrorX
    });

  console.log(
    "[AesthetIQ] LEVEL TEST",
    {
      procedure:
        normalizedProcedure,

      hasCanvas:
        !!balancedResult?.canvas,

      polygonCount:
        balancedResult?.polygons?.length,

      hasMask:
        !!balancedResult?.maskCanvas
    }
  );

  return {
    procedure:
      normalizedProcedure,

    polygons:
      balancedResult?.polygons || [],

    maskCanvas:
      balancedResult?.maskCanvas || null,

    debugCanvas:
      copyCanvas(sourceCanvas),

    naturalCanvas:
      copyCanvas(sourceCanvas),

    balancedCanvas:
      balancedResult?.canvas ||
      copyCanvas(sourceCanvas),

    enhancedCanvas:
      copyCanvas(sourceCanvas)
  };
}

// ---------------------------------------------------------
// SIMULATE FROM IMAGE OR VIDEO
// ---------------------------------------------------------

// ---------------------------------------------------------
// SIMULATE FROM IMAGE OR VIDEO
// ---------------------------------------------------------

export function runProcedureSimulationFromImage({
  procedure,
  landmarks,
  imageSource,
  anatomyProfile = null,
  tissueModel = null,

  lipStyle = "classic",
  lipProduct = "provider",

  blurPx = 18,
  mirrorX = false
}) {
  const anatomy =
    anatomyProfile || {
      anatomyStrength: 1,
      projectionStrength: 1,
      symmetryStrength: 1,
      chinStrength: 1
    };

  const sourceCanvas =
    imageToCanvas(imageSource);

  return runProcedureSimulation({
    procedure,
    landmarks,
    sourceCanvas,
    anatomyProfile: anatomy,
    tissueModel,

    lipStyle,
    lipProduct,

    blurPx,
    mirrorX
  });
}

export function runProcedureSimulationFromLandmarks({
  procedure,
  landmarks,
  imageSource,
  anatomyProfile = null,
  tissueModel = null,

  lipStyle = "classic",
  lipProduct = "provider",

  blurPx = 18,
  mirrorX = false
}) {
  const sourceCanvas =
    imageToCanvas(imageSource);

  return runProcedureSimulation({
    procedure,
    landmarks,
    sourceCanvas,
    anatomyProfile,
    tissueModel,

    lipStyle,
    lipProduct,

    blurPx,
    mirrorX
  });
}  

// ---------------------------------------------------------
// RENDER CANVAS
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
// RENDER RESULTS
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
    targets.naturalCanvas &&
    results.naturalCanvas
  ) {
    renderCanvasToElement(
      results.naturalCanvas,
      targets.naturalCanvas
    );
  }

  if (
    targets.balancedCanvas &&
    results.balancedCanvas
  ) {
    renderCanvasToElement(
      results.balancedCanvas,
      targets.balancedCanvas
    );
  }

  if (
    targets.enhancedCanvas &&
    results.enhancedCanvas
  ) {
    renderCanvasToElement(
      results.enhancedCanvas,
      targets.enhancedCanvas
    );
  }
}
