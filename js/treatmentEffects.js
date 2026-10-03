import {
  getFillerVisualProfile
} from "./fillerProfiles.js?v=1";

import {
  getFillerGoalVisualProfile
} from "./fillerGoals.js?v=1";

// =========================================================
// AESTHETIQ — TREATMENT EFFECTS
// File: js/treatmentEffects.js
// =========================================================

// ---------------------------------------------------------
// INTENSITY LEVELS
// ---------------------------------------------------------

export function getIntensityValue(level) {
  if (level === "natural") return 0.3;
  if (level === "balanced") return 0.65;
  if (level === "enhanced") return 1;

  return 0.65;
}

// ---------------------------------------------------------
// CANVAS HELPERS
// ---------------------------------------------------------

export function cloneCanvas(sourceCanvas) {
  if (!sourceCanvas) {
    return null;
  }

  const canvas = document.createElement("canvas");

  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const context = canvas.getContext("2d");

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

export function createEffectLayer(
  sourceCanvas,
  filterString = "none"
) {
  if (!sourceCanvas) {
    return null;
  }

  const canvas = document.createElement("canvas");

  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.filter = filterString;

  context.drawImage(
    sourceCanvas,
    0,
    0
  );

  context.filter = "none";

  return canvas;
}

export function applyMaskedLayer(
  baseCanvas,
  effectCanvas,
  maskCanvas,
  opacity = 1
) {
  if (
    !baseCanvas ||
    !effectCanvas ||
    !maskCanvas
  ) {
    return cloneCanvas(baseCanvas);
  }

  const output =
    document.createElement("canvas");

  output.width = baseCanvas.width;
  output.height = baseCanvas.height;

  const outputContext =
    output.getContext("2d");

  if (!outputContext) {
    return cloneCanvas(baseCanvas);
  }

  outputContext.drawImage(
    baseCanvas,
    0,
    0
  );

  const maskedEffect =
    document.createElement("canvas");

  maskedEffect.width = baseCanvas.width;
  maskedEffect.height = baseCanvas.height;

  const maskedContext =
    maskedEffect.getContext("2d");

  if (!maskedContext) {
    return cloneCanvas(baseCanvas);
  }

  maskedContext.drawImage(
    effectCanvas,
    0,
    0
  );

  maskedContext.globalCompositeOperation =
    "destination-in";

  maskedContext.drawImage(
    maskCanvas,
    0,
    0
  );

  maskedContext.globalCompositeOperation =
    "source-over";

  outputContext.save();

  outputContext.globalAlpha =
    Math.max(
      0,
      Math.min(1, opacity)
    );

  outputContext.drawImage(
    maskedEffect,
    0,
    0
  );

  outputContext.restore();

  return output;
}

export function featherMask(
  maskCanvas,
  blur = 25
) {
  if (!maskCanvas) {
    return null;
  }

  const canvas =
    document.createElement("canvas");

  canvas.width = maskCanvas.width;
  canvas.height = maskCanvas.height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.filter =
    `blur(${Math.max(0, blur)}px)`;

  context.drawImage(
    maskCanvas,
    0,
    0
  );

  context.filter = "none";

  return canvas;
}

// ---------------------------------------------------------
// UNDER-EYE FILLER
// ---------------------------------------------------------

export function simulateUnderEyeFiller(
  sourceCanvas,
  maskCanvas,
  level = "balanced",
  fillerProduct = "provider",
  fillerGoal = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const fillerProfile =
    getFillerVisualProfile(
      fillerProduct,
      "under-eye-filler"
    );

  const goalProfile =
    getFillerGoalVisualProfile(
      "under-eye-filler",
      fillerGoal
    );

  const productStrength =
    (
      (Number(fillerProfile.volume) || 1) *
        (Number(goalProfile.volume) || 1) +
      (Number(fillerProfile.spread) || 1) *
        (Number(goalProfile.blend) || 1)
    ) / 2;

  const featheredMask =
    featherMask(maskCanvas, 18);

  const brighten =
    1 + intensity * 0.16;

  const contrast =
    1 - intensity * 0.09;

  const blur =
    0.8 + intensity * 2.2;

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    (0.42 + intensity * 0.28) *
      productStrength
  );
}

// ---------------------------------------------------------
// LASER RESURFACING
// ---------------------------------------------------------

export function simulateLaserResurfacing(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 24);

  const brighten =
    1 + intensity * 0.1;

  const contrast =
    1 - intensity * 0.07;

  const saturate =
    1 + intensity * 0.05;

  const blur =
    1 + intensity * 3;

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${brighten}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px)`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    0.48 + intensity * 0.3
  );
}

// ---------------------------------------------------------
// LIP FILLER
// ---------------------------------------------------------

export function simulateLipFiller(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 10);

  const saturate =
    1 + intensity * 0.24;

  const brighten =
    1 + intensity * 0.06;

  const contrast =
    1 + intensity * 0.08;

  const blur =
    intensity * 0.35;

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `saturate(${saturate}) brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    0.46 + intensity * 0.32
  );
}

// ---------------------------------------------------------
// LIP FLIP
// ---------------------------------------------------------

export function simulateLipFlip(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 10);

  const brighten =
    1 + intensity * 0.04;

  const saturate =
    1 + intensity * 0.12;

  const contrast =
    1 + intensity * 0.04;

  const blur =
    intensity * 0.7;

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${brighten}) saturate(${saturate}) contrast(${contrast}) blur(${blur}px)`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    0.32 + intensity * 0.28
  );
}

// ---------------------------------------------------------
// FOREHEAD NEUROMODULATOR
// ---------------------------------------------------------

export function simulateForeheadBotox(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 18);

  const blurAmount =
    level === "natural"
      ? 2.5
      : level === "balanced"
      ? 5
      : 7.5;

  const smoothLayer =
    createEffectLayer(
      sourceCanvas,
      `blur(${blurAmount}px) contrast(${1 - intensity * 0.1})`
    );

  const matteLayer =
    createEffectLayer(
      sourceCanvas,
      `brightness(${1 + intensity * 0.03}) contrast(${1 - intensity * 0.06}) saturate(${1 - intensity * 0.03})`
    );

  let result =
    applyMaskedLayer(
      sourceCanvas,
      smoothLayer,
      featheredMask,
      0.26 + intensity * 0.32
    );

  result =
    applyMaskedLayer(
      result,
      matteLayer,
      featheredMask,
      0.12 + intensity * 0.18
    );

  return result;
}

// ---------------------------------------------------------
// GLABELLA NEUROMODULATOR
// ---------------------------------------------------------

export function simulateGlabellaBotox(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 10);

  const smoothLayer =
    createEffectLayer(
      sourceCanvas,
      `blur(${1.2 + intensity * 5.8}px)`
    );

  const flattenLayer =
    createEffectLayer(
      sourceCanvas,
      `contrast(${1 - intensity * 0.2}) brightness(${1 + intensity * 0.03})`
    );

  const centerLayer =
    createEffectLayer(
      sourceCanvas,
      `blur(${2 + intensity * 5}px) contrast(${1 - intensity * 0.25})`
    );

  const matteLayer =
    createEffectLayer(
      sourceCanvas,
      `contrast(${1 - intensity * 0.1}) saturate(${1 - intensity * 0.05})`
    );

  let result =
    applyMaskedLayer(
      sourceCanvas,
      smoothLayer,
      featheredMask,
      0.3 + intensity * 0.25
    );

  result =
    applyMaskedLayer(
      result,
      flattenLayer,
      featheredMask,
      0.3 + intensity * 0.26
    );

  result =
    applyMaskedLayer(
      result,
      matteLayer,
      featheredMask,
      0.12 + intensity * 0.12
    );

  if (level !== "natural") {
    result =
      applyMaskedLayer(
        result,
        centerLayer,
        featheredMask,
        level === "enhanced"
          ? 0.42
          : 0.24
      );
  }

  return result;
}

// ---------------------------------------------------------
// CROW'S FEET NEUROMODULATOR
// ---------------------------------------------------------

export function simulateCrowsFeetBotox(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 16);

  const brighten =
    1 + intensity * 0.04;

  const contrast =
    1 - intensity * 0.06;

  const blur =
    1 + intensity * 3;

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    0.34 + intensity * 0.3
  );
}

// ---------------------------------------------------------
// CHEMICAL PEEL
// ---------------------------------------------------------

export function simulateChemicalPeel(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 28);

  const brighten =
    1 + intensity * 0.1;

  const contrast =
    1 - intensity * 0.04;

  const saturate =
    1 + intensity * 0.05;

  const blur =
    1.2 + intensity * 3;

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${brighten}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px)`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    0.5 + intensity * 0.28
  );
}

// ---------------------------------------------------------
// GENERIC SKIN SMOOTHING
// ---------------------------------------------------------

export function simulateSkinSmoothing(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  /*
   * Neuromodulator preview:
   *
   * Reduce visible line contrast while
   * preserving normal skin texture.
   *
   * Natural  = subtle softening
   * Balanced = noticeable reduction
   * Enhanced = stronger reduction
   */

  const profiles = {
    natural: {
      blur: 1.15,
      brightness: 1.006,
      contrast: 0.985,
      opacity: 0.22,
      feather: 14
    },

    balanced: {
      blur: 1.55,
      brightness: 1.01,
      contrast: 0.97,
      opacity: 0.34,
      feather: 16
    },

    enhanced: {
      blur: 2.0,
      brightness: 1.014,
      contrast: 0.955,
      opacity: 0.46,
      feather: 18
    }
  };

  const profile =
    profiles[level] ||
    profiles.balanced;

  /*
   * Feather the treatment boundary so
   * there is no visible Botox-shaped patch.
   */
  const featheredMask =
    featherMask(
      maskCanvas,
      profile.feather
    );

  /*
   * Create a gently softened version of
   * the ORIGINAL skin.
   *
   * Blur stays intentionally low.
   * Most real skin texture remains visible.
   */
  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      [
        `brightness(${profile.brightness})`,
        `contrast(${profile.contrast})`,
        `blur(${profile.blur}px)`
      ].join(" ")
    );

  /*
   * Blend only part of the softened layer
   * back over the original.
   *
   * This keeps pores, lighting and normal
   * facial texture instead of producing
   * an airbrushed forehead.
   */
  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    profile.opacity
  );
}

// ---------------------------------------------------------
// TEETH WHITENING
// ---------------------------------------------------------

export function simulateTeethWhitening(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 4);

  const brighten =
    1 + intensity * 0.28;

  const saturate =
    1 - intensity * 0.24;

  const contrast =
    1 + intensity * 0.05;

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${brighten}) saturate(${saturate}) contrast(${contrast})`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    0.46 + intensity * 0.42
  );
}

// ---------------------------------------------------------
// SUBTLE SUPPORT EFFECTS FOR GEOMETRY PROCEDURES
// ---------------------------------------------------------

export function simulateVolumeSupport(
  sourceCanvas,
  maskCanvas,
  level = "balanced",
  fillerProduct = "provider",
  procedure = "",
  fillerGoal = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const fillerProfile =
    getFillerVisualProfile(
      fillerProduct,
      procedure
    );

  const goalProfile =
    getFillerGoalVisualProfile(
      procedure,
      fillerGoal
    );

  const productStrength =
    (
      (Number(fillerProfile.volume) || 1) *
        (Number(goalProfile.volume) || 1) +
      (Number(fillerProfile.projection) || 1) *
        (Number(goalProfile.projection) || 1) *
        (Number(goalProfile.definition) || 1)
    ) / 2;

  const featheredMask =
    featherMask(maskCanvas, 14);

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${1 + intensity * 0.018}) contrast(${1 + intensity * 0.012}) saturate(${1 + intensity * 0.01})`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    (0.16 + intensity * 0.12) *
      productStrength
  );
}

export function simulateContourSupport(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 14);

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${1 - intensity * 0.018}) contrast(${1 + intensity * 0.045}) saturate(${1 - intensity * 0.015})`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    0.15 + intensity * 0.14
  );
}

export function simulateLiftSupport(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 16);

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${1 + intensity * 0.012}) contrast(${1 - intensity * 0.025}) blur(${0.6 + intensity * 0.8}px)`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    0.14 + intensity * 0.12
  );
}

export function simulateDentalSurface(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 3);

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${1 + intensity * 0.12}) contrast(${1 + intensity * 0.035}) saturate(${1 - intensity * 0.08})`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    0.28 + intensity * 0.28
  );
}

export function simulateGumContour(
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 3);

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${1 + intensity * 0.025}) contrast(${1 - intensity * 0.025}) saturate(${1 - intensity * 0.04})`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    0.18 + intensity * 0.16
  );
}

// ---------------------------------------------------------
// PROCEDURE ROUTER
// ---------------------------------------------------------

export function applyTreatmentEffect(
  procedure,
  sourceCanvas,
  maskCanvas,
  level = "balanced",
  fillerProduct = "provider",
  fillerGoal = "balanced"
) {
  switch (procedure) {
    // Under-eye filler
    case "underEyeFiller":
    case "under-eye-filler":
      return simulateUnderEyeFiller(
        sourceCanvas,
        maskCanvas,
        level,
        fillerProduct,
        fillerGoal
      );

    // Laser resurfacing
    case "laserEye":
    case "laser-resurfacing":
    case "co2-laser":
      return simulateLaserResurfacing(
        sourceCanvas,
        maskCanvas,
        level
      );

    // Lip filler
    case "lipFiller":
    case "lip-filler":
      return simulateLipFiller(
        sourceCanvas,
        maskCanvas,
        level
      );

    // Lip flip
    case "lipFlip":
    case "lip-flip":
      return simulateLipFlip(
        sourceCanvas,
        maskCanvas,
        level
      );

    // Forehead neuromodulator
    // Use the texture-preserving smoothing path.
    case "foreheadBotox":
    case "forehead-neuromodulator":
      return simulateSkinSmoothing(
        sourceCanvas,
        maskCanvas,
        level
      );

    // Glabella neuromodulator
    case "glabella":
    case "glabellaBotox":
    case "glabella-neuromodulator":
      return simulateGlabellaBotox(
        sourceCanvas,
        maskCanvas,
        level
      );

    // Crow's feet neuromodulator
    case "crowsfeet":
    case "crowsFeetBotox":
    case "crows-feet-neuromodulator":
      return simulateCrowsFeetBotox(
        sourceCanvas,
        maskCanvas,
        level
      );

    // Skin treatments
    case "chemicalPeel":
    case "chemical-peel":
      return simulateChemicalPeel(
        sourceCanvas,
        maskCanvas,
        level
      );

    case "microneedling":
    case "rf-microneedling":
    case "ipl":
      return simulateSkinSmoothing(
        sourceCanvas,
        maskCanvas,
        level
      );

    // Teeth whitening
    case "teethWhitening":
    case "teeth-whitening":
      return simulateTeethWhitening(
        sourceCanvas,
        maskCanvas,
        level
      );

    // Volume and implant support
    case "chin-filler":
    case "chin-implant":
    case "cheek-filler":
    case "cheek-implants":
    case "temple-filler":
    case "facial-fat-transfer":
      return simulateVolumeSupport(
        sourceCanvas,
        maskCanvas,
        level,
        fillerProduct,
        procedure,
        fillerGoal
      );

    // Contour / reduction procedures
    case "rhinoplasty":
    case "revision-rhinoplasty":
    case "buccal-fat-removal":
    case "jawline-filler":
      return simulateContourSupport(
        sourceCanvas,
        maskCanvas,
        level
      );

    // Surgical lift / eyelid support
    case "facelift":
    case "mini-facelift":
    case "brow-lift":
    case "upper-blepharoplasty":
    case "lower-blepharoplasty":
    case "lip-lift":
      return simulateLiftSupport(
        sourceCanvas,
        maskCanvas,
        level
      );

    // Smile surface simulations
    case "veneers":
    case "dental-bonding":
      return simulateDentalSurface(
        sourceCanvas,
        maskCanvas,
        level
      );

    case "gum-contouring":
      return simulateGumContour(
        sourceCanvas,
        maskCanvas,
        level
      );

    case "smile-makeover": {
      const whitened =
        simulateTeethWhitening(
          sourceCanvas,
          maskCanvas,
          level
        );

      return simulateDentalSurface(
        whitened,
        maskCanvas,
        level
      );
    }

    case "eyebrow-transplant":
      return simulateContourSupport(
        sourceCanvas,
        maskCanvas,
        level
      );

    default:
      console.warn(
        `[AesthetIQ] No treatment effect found for: ${procedure}`
      );

      return cloneCanvas(sourceCanvas);
  }
}
