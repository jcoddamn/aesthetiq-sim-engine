import { warpLipFiller,
  warpChin,
  warpCheeks } from "./faceWarp.js";

// =========================================================
// AESTHETIQ — TREATMENT EFFECTS
// File: js/treatmentEffects.js
// =========================================================

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
  level = "balanced"
) {
  const intensity =
    getIntensityValue(level);

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
    0.42 + intensity * 0.28
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
  const intensity =
    getIntensityValue(level);

  const featheredMask =
    featherMask(maskCanvas, 20);

  const effectCanvas =
    createEffectLayer(
      sourceCanvas,
      `brightness(${1 + intensity * 0.04}) contrast(${1 - intensity * 0.05}) blur(${1 + intensity * 2.4}px)`
    );

  return applyMaskedLayer(
    sourceCanvas,
    effectCanvas,
    featheredMask,
    0.3 + intensity * 0.28
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
// PROCEDURE ROUTER
// ---------------------------------------------------------

export function applyTreatmentEffect(
  procedure,
  sourceCanvas,
  maskCanvas,
  level = "balanced"
) {
  switch (procedure) {
    // Under-eye filler
    case "underEyeFiller":
    case "under-eye-filler":
      return simulateUnderEyeFiller(
        sourceCanvas,
        maskCanvas,
        level
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
    case "foreheadBotox":
    case "forehead-neuromodulator":
      return simulateForeheadBotox(
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

    default:
      console.warn(
        `[AesthetIQ] No treatment effect found for: ${procedure}`
      );

      return cloneCanvas(sourceCanvas);
  }
}
