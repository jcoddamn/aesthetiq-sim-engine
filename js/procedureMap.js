// =========================================================
// AESTHETIQ — PROCEDURE TO MASK MAPPING
// File: js/procedureMap.js
// =========================================================

import {
  getMaskPolygons,
  hasMaskDefinition
} from "./mediapipeMasks.js";

// ---------------------------------------------------------
// PROCEDURE CONFIGURATION
// ---------------------------------------------------------

export const PROCEDURE_MAP = {
  // =======================================================
  // FACE SURGERY
  // =======================================================

  rhinoplasty: {
    masks: [
      "noseBridge",
      "noseTip",
      "leftNostril",
      "rightNostril",
      "nasalBase"
    ],
    effect: "rhinoplasty",
    category: "nose"
  },

  "revision-rhinoplasty": {
    masks: [
      "noseBridge",
      "noseTip",
      "leftNostril",
      "rightNostril",
      "nasalBase"
    ],
    effect: "rhinoplasty",
    category: "nose"
  },

  "chin-implant": {
    masks: ["chin"],
    effect: "chinProjection",
    category: "chin"
  },

  "cheek-implants": {
    masks: ["leftCheek", "rightCheek"],
    effect: "cheekVolume",
    category: "cheeks"
  },

  "buccal-fat-removal": {
    masks: [
      "leftBuccalArea",
      "rightBuccalArea"
    ],
    effect: "buccalSlimming",
    category: "cheeks"
  },

  facelift: {
    masks: [
      "leftCheek",
      "rightCheek",
      "leftJawline",
      "rightJawline",
      "lowerFace"
    ],
    effect: "facelift",
    category: "lowerFace"
  },

  "mini-facelift": {
    masks: [
      "leftCheek",
      "rightCheek",
      "leftJawline",
      "rightJawline"
    ],
    effect: "facelift",
    category: "lowerFace"
  },

  "brow-lift": {
    masks: [
      "leftBrow",
      "rightBrow",
      "forehead"
    ],
    effect: "browLift",
    category: "brows"
  },

  "upper-blepharoplasty": {
    masks: [
      "leftUpperEyelid",
      "rightUpperEyelid"
    ],
    effect: "upperBlepharoplasty",
    category: "eyes"
  },

  "lower-blepharoplasty": {
    masks: [
      "leftUnderEye",
      "rightUnderEye"
    ],
    effect: "lowerBlepharoplasty",
    category: "eyes"
  },

  "lip-lift": {
    masks: [
      "upperLip",
      "philtrum",
      "cupidsBow"
    ],
    effect: "lipLift",
    category: "lips"
  },

  "facial-fat-transfer": {
    masks: [
      "leftCheek",
      "rightCheek",
      "leftTemple",
      "rightTemple",
      "leftUnderEye",
      "rightUnderEye"
    ],
    effect: "facialVolume",
    category: "faceVolume"
  },

  // =======================================================
  // FILLERS
  // =======================================================

  "lip-filler": {
    masks: [
      "upperLip",
      "lowerLip"
    ],
    effect: "lipVolume",
    category: "lips"
  },

  "cheek-filler": {
    masks: [
      "leftCheek",
      "rightCheek"
    ],
    effect: "cheekVolume",
    category: "cheeks"
  },

  "chin-filler": {
    masks: ["chin"],
    effect: "chinProjection",
    category: "chin"
  },

  "jawline-filler": {
    masks: [
      "leftJawline",
      "rightJawline",
      "chin"
    ],
    effect: "jawlineDefinition",
    category: "jawline"
  },

  "under-eye-filler": {
    masks: [
      "leftUnderEye",
      "rightUnderEye"
    ],
    effect: "underEyeVolume",
    category: "eyes"
  },

  "temple-filler": {
    masks: [
      "leftTemple",
      "rightTemple"
    ],
    effect: "templeVolume",
    category: "temples"
  },

  // =======================================================
  // NEUROMODULATORS
  // =======================================================

  "forehead-neuromodulator": {
    masks: ["forehead"],
    effect: "skinSmoothing",
    category: "forehead"
  },

  "glabella-neuromodulator": {
    masks: ["glabella"],
    effect: "skinSmoothing",
    category: "glabella"
  },

  "crows-feet-neuromodulator": {
    masks: [
      "leftCrowsFeet",
      "rightCrowsFeet"
    ],
    effect: "skinSmoothing",
    category: "eyes"
  },

  "lip-flip": {
    masks: [
      "upperLip",
      "philtrum"
    ],
    effect: "lipFlip",
    category: "lips"
  },

  // =======================================================
  // SKIN
  // =======================================================

  "chemical-peel": {
    masks: ["fullFace"],
    effect: "skinResurfacing",
    category: "skin"
  },

  "laser-resurfacing": {
    masks: ["fullFace"],
    effect: "skinResurfacing",
    category: "skin"
  },

  microneedling: {
    masks: ["fullFace"],
    effect: "skinRenewal",
    category: "skin"
  },

  "rf-microneedling": {
    masks: ["fullFace"],
    effect: "skinTightening",
    category: "skin"
  },

  ipl: {
    masks: ["fullFace"],
    effect: "toneCorrection",
    category: "skin"
  },

  "co2-laser": {
    masks: ["fullFace"],
    effect: "skinResurfacing",
    category: "skin"
  },

  // =======================================================
  // HAIR
  // =======================================================

  "hairline-lowering": {
    masks: [],
    effect: "hairlineLowering",
    category: "hairline",
    externalMaskRequired: true
  },

  // =======================================================
  // SMILE
  // =======================================================

  veneers: {
    masks: ["teeth"],
    effect: "veneers",
    category: "smile"
  },

  "dental-bonding": {
    masks: ["teeth"],
    effect: "dentalBonding",
    category: "smile"
  },

  "teeth-whitening": {
    masks: ["teeth"],
    effect: "teethWhitening",
    category: "smile"
  },

  "gum-contouring": {
    masks: ["gums"],
    effect: "gumContouring",
    category: "smile"
  }
};

// ---------------------------------------------------------
// LEGACY CAMERA PROCEDURE ALIASES
// ---------------------------------------------------------

export const PROCEDURE_ALIASES = {
  lipFiller: "lip-filler",
  cheekFiller: "cheek-filler",
  chinFiller: "chin-filler",
  jawlineFiller: "jawline-filler",
  underEyeFiller: "under-eye-filler",
  templeFiller: "temple-filler",

  lipFlip: "lip-flip",

  foreheadBotox: "forehead-neuromodulator",
  glabellaBotox: "glabella-neuromodulator",
  glabella: "glabella-neuromodulator",

  crowsFeetBotox:
    "crows-feet-neuromodulator",

  crowsfeet:
    "crows-feet-neuromodulator",

  chinImplant: "chin-implant",
  buccalFatRemoval: "buccal-fat-removal",

  browLift: "brow-lift",

  upperBlepharoplasty:
    "upper-blepharoplasty",

  lowerBlepharoplasty:
    "lower-blepharoplasty",

  lipLift: "lip-lift",

  chemicalPeel: "chemical-peel",
  dentalBonding: "dental-bonding",
  teethWhitening: "teeth-whitening",
  gumContouring: "gum-contouring",
  hairlineLowering: "hairline-lowering"
};

// ---------------------------------------------------------
// NORMALIZATION
// ---------------------------------------------------------

export function normalizeProcedureId(
  procedureId
) {
  if (!procedureId) {
    return "";
  }

  return (
    PROCEDURE_ALIASES[procedureId] ||
    procedureId
  );
}

// ---------------------------------------------------------
// LOOKUP HELPERS
// ---------------------------------------------------------

export function getProcedureConfig(
  procedureId
) {
  const normalizedId =
    normalizeProcedureId(procedureId);

  return PROCEDURE_MAP[normalizedId] || null;
}

export function getProcedureMaskNames(
  procedureId
) {
  const config =
    getProcedureConfig(procedureId);

  return config?.masks || [];
}

export function getProcedureEffect(
  procedureId
) {
  const config =
    getProcedureConfig(procedureId);

  return config?.effect || null;
}

export function isProcedureSupported(
  procedureId
) {
  return Boolean(
    getProcedureConfig(procedureId)
  );
}

export function requiresExternalMask(
  procedureId
) {
  const config =
    getProcedureConfig(procedureId);

  return Boolean(
    config?.externalMaskRequired
  );
}

// ---------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------

export function validateProcedureMasks(
  procedureId
) {
  const maskNames =
    getProcedureMaskNames(procedureId);

  const missingMasks =
    maskNames.filter(
      (maskName) =>
        !hasMaskDefinition(maskName)
    );

  return {
    valid: missingMasks.length === 0,
    procedureId:
      normalizeProcedureId(procedureId),
    maskNames,
    missingMasks
  };
}

// ---------------------------------------------------------
// BUILD PROCEDURE POLYGONS
// ---------------------------------------------------------

export function getProcedureMask(
  procedureId,
  landmarks,
  canvasWidth,
  canvasHeight,
  mirrorX = false
) {
  const normalizedId =
    normalizeProcedureId(procedureId);

  const config =
    getProcedureConfig(normalizedId);

  if (!config) {
    console.warn(
      `[AesthetIQ] Unknown procedure: ${procedureId}`
    );

    return [];
  }

  if (config.externalMaskRequired) {
    console.warn(
      `[AesthetIQ] ${normalizedId} requires segmentation or an external mask.`
    );

    return [];
  }

  const validation =
    validateProcedureMasks(normalizedId);

  if (!validation.valid) {
    console.warn(
      `[AesthetIQ] Missing masks for ${normalizedId}:`,
      validation.missingMasks
    );
  }

  return validation.maskNames.flatMap(
    (maskName) =>
      getMaskPolygons(
        maskName,
        landmarks,
        canvasWidth,
        canvasHeight,
        mirrorX
      )
  );
}

// ---------------------------------------------------------
// DEVELOPMENT REPORT
// ---------------------------------------------------------

export function getProcedureSupportReport() {
  return Object.entries(PROCEDURE_MAP).map(
    ([procedureId, config]) => {
      const validation =
        validateProcedureMasks(procedureId);

      return {
        procedureId,
        category: config.category,
        effect: config.effect,
        masks: config.masks,
        externalMaskRequired:
          Boolean(
            config.externalMaskRequired
          ),
        valid: validation.valid,
        missingMasks:
          validation.missingMasks
      };
    }
  );
}
