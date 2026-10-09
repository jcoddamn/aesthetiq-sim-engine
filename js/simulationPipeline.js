import {measurePreviewGeometry} from './previewMeasurements.js';
// =========================================================
// AESTHETIQ — SIMULATION PIPELINE
// File: js/simulationPipeline.js
// =========================================================

import {
  getProcedureMask,
  normalizeProcedureId
} from "./procedureMap.js?v=3";

import {
  createFeatheredMask
} from "./maskUtils.js";

import {
  applyTreatmentEffect
} from "./treatmentEffects.js?v=11";

import {
  createMaskDebugCanvas
} from "./maskDebugger.js";

import {
  warpLipFiller,
  warpChin,
  warpCheeks,
  warpJawline,
  warpRhinoplasty,
  warpBuccalSlimming,
  warpFacelift,
  warpBrowLift,
  warpUpperBlepharoplasty,
  warpLowerBlepharoplasty,
  warpLipLift
} from "./faceWarp.js?v=25";

import {
  renderWarp,
  getFaceTriangles
} from "./warpRenderer.js?v=2";

import {
  MeshRenderer
} from "./meshRenderer.js?v=7";

import {
  applySoftTissueLighting
} from "./softTissueLighting.js";

import {
  getProcedureConstraints
} from "./procedureConstraints.js?v=2";

import {
  constrainWarpByFaceScale,
  compareFaceMorphometrics
} from "./faceMorphometrics.js?v=3";

import {
  repairLowerLipTexture
} from "./lipTextureRepair.js";

import {
  buildDentalMesh,
  createDentalMeshMask,
  renderDentalGeometry
} from "./dentalMesh.js?v=2";
import {refineProcedureMask} from "./anatomicalMask2D.js?v=1";
import {inspectWarp,moderateWarp,inspectRender} from "./simulationQuality2D.js?v=1";
import {preserveSkinDetail} from "./skinDetail2D.js?v=1";
import {refineDentalAppearanceMask} from "./dentalAppearanceMask2D.js?v=1";
import {depthAwareWarp} from "./depthAwareWarp2D.js?v=1";

const meshRenderer =
  new MeshRenderer();

const LIP_RENDER_INDICES =
  new Set([
    // Outer upper lip
    61, 185, 40, 39, 37,
    0, 267, 269, 270, 409, 291,

    // Outer lower lip
    146, 91, 181, 84,
    17, 314, 405, 321, 375,

    // Inner upper lip
    78, 191, 80, 81, 82,
    13, 312, 311, 310, 415, 308,

    // Inner lower lip
    95, 88, 178, 87,
    14, 317, 402, 318, 324,

    // Immediate upper-lip skin
    164, 167, 165, 92, 186,
    57, 43, 106, 182, 83,
    18, 313, 406, 335, 273,
    287, 410, 322, 391, 393,

    // Immediate side transition
    205, 50, 187, 207,
    206, 203, 129, 202, 214,
    425, 280, 411, 427,
    426, 423, 358, 422, 434,

    // Lower-lip transition
    200, 199, 175,
    208, 201, 194,
    428, 421, 418
  ]);

const lipTriangles =
  getFaceTriangles().filter(
    (triangle) =>
      Array.isArray(triangle) &&
      triangle.length >= 3 &&
      triangle.every(
        (index) =>
          LIP_RENDER_INDICES.has(index)
      )
  );

meshRenderer.setTriangles(
  lipTriangles
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

const DENTAL_MESH_PROCEDURES =
  new Set([
    "veneers",
    "dental-bonding",
    "teeth-whitening",
    "gum-contouring",
    "smile-makeover"
  ]);

function usesDentalMesh(procedure) {
  return DENTAL_MESH_PROCEDURES.has(
    procedure
  );
}

function usesGeometryWarp(procedure) {
  return [
    "lip-filler",
    "chin-filler",
    "chin-implant",
    "cheek-filler",
    "cheek-implants",
    "jawline-filler",
    "rhinoplasty",
    "revision-rhinoplasty",
    "buccal-fat-removal",
    "facelift",
    "mini-facelift",
    "brow-lift",
    "upper-blepharoplasty",
    "lower-blepharoplasty",
    "lip-lift"
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

function constrainWarpResult(
  originalLandmarks,
  warpedLandmarks,
  constraints
) {
  if (
    !Array.isArray(warpedLandmarks)
  ) {
    return warpedLandmarks;
  }

  const strength =
    Math.max(
      0.6,
      Math.min(
        1.2,
        Number(
          constraints?.strengthMultiplier
        ) || 1
      )
    );

  const scaledLandmarks =
    warpedLandmarks.map(
      (point, index) => {
        const original =
          originalLandmarks[index];

        if (!point || !original) {
          return point;
        }

        const originalZ =
          Number(original.z) || 0;

        const pointZ =
          Number(point.z);

        return {
          ...point,
          x:
            original.x +
            (point.x - original.x) *
              strength,
          y:
            original.y +
            (point.y - original.y) *
              strength,
          z:
            originalZ +
            (
              (
                Number.isFinite(pointZ)
                  ? pointZ
                  : originalZ
              ) -
              originalZ
            ) *
              strength
        };
      }
    );

  return applyLandmarkConstraints(
    originalLandmarks,
    scaledLandmarks,
    constraints
  );
}

function createWarpedLandmarks(
  procedure,
  landmarks,
  level,
  anatomyProfile,
  tissueModel,
  constraints,
  procedureOption = "",
  lipStyle = "classic",
  fillerProduct = "provider",
  fillerGoal = "balanced",
  imageSize = null
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
        fillerProduct,
        fillerGoal,
        imageSize
      );

    return applyLandmarkConstraints(
      landmarks,
      warped,
      constraints
    );
  }

  case "chin-filler":
    return warpChin(
      landmarks,
      level,
      fillerProduct,
      fillerGoal
    );

  case "chin-implant":
    return warpChin(
      landmarks,
      level
    );

  case "cheek-filler":
    return warpCheeks(
      landmarks,
      level,
      fillerProduct,
      fillerGoal
    );

  case "cheek-implants":
    return warpCheeks(
      landmarks,
      level
    );

  case "jawline-filler":
    return warpJawline(
      landmarks,
      level,
      fillerProduct,
      fillerGoal
    );

  case "rhinoplasty":
  case "revision-rhinoplasty":
    return constrainWarpResult(
      landmarks,
      warpRhinoplasty(
        landmarks,
        level,
        procedureOption,
        procedure ===
          "revision-rhinoplasty"
      ),
      constraints
    );

  case "buccal-fat-removal":
    return constrainWarpResult(
      landmarks,
      warpBuccalSlimming(
        landmarks,
        level,
        procedureOption
      ),
      constraints
    );

  case "facelift":
    return constrainWarpResult(
      landmarks,
      warpFacelift(
        landmarks,
        level,
        false,
        procedureOption
      ),
      constraints
    );

  case "mini-facelift":
    return constrainWarpResult(
      landmarks,
      warpFacelift(
        landmarks,
        level,
        true,
        procedureOption
      ),
      constraints
    );

  case "brow-lift":
    return constrainWarpResult(
      landmarks,
      warpBrowLift(
        landmarks,
        level,
        procedureOption
      ),
      constraints
    );

  case "upper-blepharoplasty":
    return constrainWarpResult(
      landmarks,
      warpUpperBlepharoplasty(
        landmarks,
        level,
        procedureOption
      ),
      constraints
    );

  case "lower-blepharoplasty":
    return constrainWarpResult(
      landmarks,
      warpLowerBlepharoplasty(
        landmarks,
        level,
        procedureOption
      ),
      constraints
    );

  case "lip-lift":
    return constrainWarpResult(
      landmarks,
      warpLipLift(
        landmarks,
        level,
        procedureOption
      ),
      constraints
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

  procedureOption = "",
  lipStyle = "classic",
  fillerProduct = "provider",
  fillerGoal = "balanced",
  neuromodulatorProduct = "botox",

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
        procedureOption,
        lipStyle,
        fillerProduct,
        fillerGoal,
        {width:sourceCanvas.width,height:sourceCanvas.height}
      );

    workingLandmarks =
      constrainWarpByFaceScale(
        landmarks,
        workingLandmarks,
        normalizedProcedure
      );

    workingLandmarks = depthAwareWarp(
      landmarks,workingLandmarks,normalizedProcedure
    );

    const warpReview = inspectWarp(landmarks,workingLandmarks,normalizedProcedure);
    if (!warpReview.valid) {
      workingLandmarks = moderateWarp(landmarks,workingLandmarks,warpReview.scale);
    }

    if (level === "balanced") {
      const comparison =
        compareFaceMorphometrics(
          landmarks,
          workingLandmarks
        );
      if (comparison) {
        console.debug(
          "[AesthetIQ] Facial morphometrics",
          normalizedProcedure,
          comparison.delta
        );
      }
    }

    if (
      normalizedProcedure ===
      "lip-filler"
    ) {
      console.log(
        "[AesthetIQ] MESH RENDER TEST",
        {
          originalCount:
            landmarks?.length,

          warpedCount:
            workingLandmarks?.length
        }
      );

      try {
        const meshCanvas =
          meshRenderer.render(
            sourceCanvas,
            landmarks,
            workingLandmarks
          );

        if (!meshCanvas) {
          throw new Error(
            "MeshRenderer returned no canvas."
          );
        }

        workingCanvas =
          meshCanvas;

      } catch (error) {
        console.error(
          "[AesthetIQ] MeshRenderer failed:",
          error
        );

        workingCanvas =
          copyCanvas(sourceCanvas);

        setTimeout(() => {
          alert(
            `MeshRenderer failed: ${
              error?.message ||
              String(error)
            }`
          );
        }, 0);
      }

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
    maskCanvas:
      generatedMaskCanvas
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

  let maskCanvas =
    generatedMaskCanvas;

  let dentalMesh = null;

  if (
    usesDentalMesh(
      normalizedProcedure
    )
  ) {
    dentalMesh =
      buildDentalMesh(
        workingLandmarks,
        workingCanvas.width,
        workingCanvas.height,
        mirrorX
      );

    if (
      dentalMesh?.valid &&
      normalizedProcedure !==
        "gum-contouring"
    ) {
      maskCanvas =
        createDentalMeshMask(
          dentalMesh,
          generatedMaskCanvas,
          {
            upperOnly:
              normalizedProcedure ===
                "veneers" ||
              normalizedProcedure ===
                "dental-bonding"
          }
        ) ||
        generatedMaskCanvas;
    }
  }

  maskCanvas = refineProcedureMask(
    maskCanvas,normalizedProcedure,workingLandmarks,mirrorX
  );

  if (dentalMesh?.valid) {
    maskCanvas = refineDentalAppearanceMask(
      workingCanvas,maskCanvas,normalizedProcedure
    );
  }

  if (!maskCanvas) {
    return {
      canvas:
        workingCanvas,

      landmarks:
        workingLandmarks,

      polygons: [],

      maskCanvas: null
    };
  }

  let treatmentSourceCanvas =
    workingCanvas;

  if (
    dentalMesh?.valid &&
    [
      "veneers",
      "dental-bonding",
      "smile-makeover"
    ].includes(
      normalizedProcedure
    )
  ) {
    treatmentSourceCanvas =
      renderDentalGeometry(
        workingCanvas,
        dentalMesh,
        generatedMaskCanvas,
        level,
        normalizedProcedure,
        procedureOption
      ) ||
      workingCanvas;
  }

  let resultCanvas =
    applyTreatmentEffect(
      normalizedProcedure,
      treatmentSourceCanvas,
      maskCanvas,
      level,
      fillerProduct,
      fillerGoal,
      neuromodulatorProduct,
      procedureOption,
      dentalMesh
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

  if ([
    "chemical-peel","laser-resurfacing","co2-laser",
    "microneedling","rf-microneedling","ipl",
    "forehead-neuromodulator","glabella-neuromodulator",
    "crows-feet-neuromodulator"
  ].includes(normalizedProcedure) && resultCanvas) {
    resultCanvas = preserveSkinDetail(
      sourceCanvas,resultCanvas,maskCanvas,level,normalizedProcedure
    );
  }

  const quality = inspectRender(sourceCanvas,resultCanvas||workingCanvas);
  const safeCanvas = quality.valid ? (resultCanvas||workingCanvas) : workingCanvas;
  return {
    canvas: safeCanvas,
    landmarks: workingLandmarks,
    polygons,
    maskCanvas,
    quality: {
      ...quality,
      warp: usesGeometryWarp(normalizedProcedure)
        ? inspectWarp(landmarks,workingLandmarks,normalizedProcedure)
        : null
    }
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

  procedureOption = "",
  lipStyle = "classic",
  fillerProduct = "provider",
  fillerGoal = "balanced",
  neuromodulatorProduct = "botox",

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

  // NATURAL
  const naturalResult =
    createSimulationLevel({
      normalizedProcedure,
      level: "natural",
      landmarks,
      sourceCanvas,
      anatomyProfile,
      tissueModel,
      procedureOption,
      lipStyle,
      fillerProduct,
      fillerGoal,
      neuromodulatorProduct,
      blurPx,
      mirrorX
    });

  // BALANCED
  const balancedResult =
    createSimulationLevel({
      normalizedProcedure,
      level: "balanced",
      landmarks,
      sourceCanvas,
      anatomyProfile,
      tissueModel,
      procedureOption,
      lipStyle,
      fillerProduct,
      fillerGoal,
      neuromodulatorProduct,
      blurPx,
      mirrorX
    });

  // ENHANCED
  const enhancedResult =
    createSimulationLevel({
      normalizedProcedure,
      level: "enhanced",
      landmarks,
      sourceCanvas,
      anatomyProfile,
      tissueModel,
      procedureOption,
      lipStyle,
      fillerProduct,
      fillerGoal,
      neuromodulatorProduct,
      blurPx,
      mirrorX
    });

  console.log(
    "[AesthetIQ] LEVEL RESULTS",
    {
      procedure:
        normalizedProcedure,

      natural:
        !!naturalResult?.canvas,

      balanced:
        !!balancedResult?.canvas,

      enhanced:
        !!enhancedResult?.canvas
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
      naturalResult?.canvas ||
      copyCanvas(sourceCanvas),

    balancedCanvas:
      balancedResult?.canvas ||
      copyCanvas(sourceCanvas),

    enhancedCanvas:
      enhancedResult?.canvas ||
      copyCanvas(sourceCanvas),

    quality: {
      natural: naturalResult?.quality || null,
      balanced: balancedResult?.quality || null,
      enhanced: enhancedResult?.quality || null
    },

    measurements: measurePreviewGeometry({procedure:normalizedProcedure,original:landmarks,
      imageSize:{width:sourceCanvas.width,height:sourceCanvas.height},
      levels:{natural:naturalResult?.landmarks||landmarks,balanced:balancedResult?.landmarks||landmarks,enhanced:enhancedResult?.landmarks||landmarks}}),
    // Research audit data; not presented as clinical outcome measurements.
    landmarksByLevel: {
      natural: naturalResult?.landmarks || landmarks,
      balanced: balancedResult?.landmarks || landmarks,
      enhanced: enhancedResult?.landmarks || landmarks
    }
  };
}

// ---------------------------------------------------------
// SIMULATE FROM IMAGE OR VIDEO
// ---------------------------------------------------------

export function runProcedureSimulationFromImage({
  procedure,
  landmarks,
  imageSource,
  anatomyProfile = null,
  tissueModel = null,

  procedureOption = "",
  lipStyle = "classic",
  fillerProduct = "provider",
  fillerGoal = "balanced",
  neuromodulatorProduct = "botox",

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

    procedureOption,
    lipStyle,
    fillerProduct,
    fillerGoal,
    neuromodulatorProduct,

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

  procedureOption = "",
  lipStyle = "classic",
  fillerProduct = "provider",
  fillerGoal = "balanced",
  neuromodulatorProduct = "botox",

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

    procedureOption,
    lipStyle,
    fillerProduct,
    fillerGoal,
    neuromodulatorProduct,

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
