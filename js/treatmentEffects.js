export function getIntensityValue(level) {
  if (level === 'subtle') return 0.2;
  if (level === 'moderate') return 0.65;
  if (level === 'extreme') return 2.1;
  return 0.65;
}

export function cloneCanvas(sourceCanvas) {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);

  return canvas;
}

export function createEffectLayer(sourceCanvas, filterString) {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const ctx = canvas.getContext('2d');
  ctx.filter = filterString;
  ctx.drawImage(sourceCanvas, 0, 0);

  return canvas;
}

export function applyMaskedLayer(baseCanvas, effectCanvas, maskCanvas, opacity = 1) {
  const output = document.createElement('canvas');
  output.width = baseCanvas.width;
  output.height = baseCanvas.height;

  const ctx = output.getContext('2d');
  ctx.drawImage(baseCanvas, 0, 0);

  const maskedEffect = document.createElement('canvas');
  maskedEffect.width = baseCanvas.width;
  maskedEffect.height = baseCanvas.height;

  const mctx = maskedEffect.getContext('2d');
  mctx.drawImage(effectCanvas, 0, 0);
  mctx.globalCompositeOperation = 'destination-in';
  mctx.drawImage(maskCanvas, 0, 0);

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(maskedEffect, 0, 0);
  ctx.restore();

  return output;
}

export function featherMask(maskCanvas, blur = 25) {
  const canvas = document.createElement('canvas');
  canvas.width = maskCanvas.width;
  canvas.height = maskCanvas.height;

  const ctx = canvas.getContext('2d');
  ctx.filter = `blur(${blur}px)`;
  ctx.drawImage(maskCanvas, 0, 0);

  return canvas;
}

export function simulateUnderEyeFiller(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);
  const featheredMask = featherMask(maskCanvas, 18);

  const brighten = 1 + intensity * 0.22;
  const contrast = 1 - intensity * 0.12;
  const blur = 1 + intensity * 3.2;
  const opacity = Math.min(0.95, 0.72 + intensity * 0.18);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, featheredMask, opacity);
}

export function simulateLaserResurfacing(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);
  const featheredMask = featherMask(maskCanvas, 24);

  const brighten = 1 + intensity * 0.12;
  const contrast = 1 - intensity * 0.1;
  const saturate = 1 + intensity * 0.08;
  const blur = 1.5 + intensity * 4.2;
  const opacity = Math.min(0.96, 0.72 + intensity * 0.2);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, featheredMask, opacity);
}

export function simulateLipFiller(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);
  const featheredMask = featherMask(maskCanvas, 10);

  const saturate = 1 + intensity * 0.45;
  const brighten = 1 + intensity * 0.12;
  const contrast = 1 + intensity * 0.14;
  const blur = intensity * 0.5;
  const opacity = Math.min(0.98, 0.72 + intensity * 0.22);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `saturate(${saturate}) brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, featheredMask, opacity);
}

export function simulateLipFlip(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);
  const featheredMask = featherMask(maskCanvas, 10);

  const brighten = 1 + intensity * 0.08;
  const saturate = 1 + intensity * 0.22;
  const contrast = 1 + intensity * 0.08;
  const blur = intensity * 1.2;
  const opacity = Math.min(0.92, 0.58 + intensity * 0.18);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) saturate(${saturate}) contrast(${contrast}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, featheredMask, opacity);
}

export function simulateForeheadBotox(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const featheredMask = featherMask(maskCanvas, 40);

  const smoothLayer = createEffectLayer(
    sourceCanvas,
    `blur(${2 + Math.pow(intensity, 1.7) * 14}px)`
  );

  const flattenLayer = createEffectLayer(
    sourceCanvas,
    `contrast(${1 - intensity * 0.38}) brightness(${1 + intensity * 0.04})`
  );

  const matteLayer = createEffectLayer(
    sourceCanvas,
    `contrast(${1 - intensity * 0.28}) saturate(${1 - intensity * 0.12})`
  );

  let result = applyMaskedLayer(
    sourceCanvas,
    smoothLayer,
    featheredMask,
    0.42 + intensity * 0.28
  );

  result = applyMaskedLayer(
    result,
    flattenLayer,
    featheredMask,
    0.48 + intensity * 0.34
  );

  result = applyMaskedLayer(
    result,
    matteLayer,
    featheredMask,
    0.26 + intensity * 0.24
  );

  return result;
} 

export function simulateGlabellaBotox(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);
  const featheredMask = featherMask(maskCanvas, 20);

  const brighten = 1 + intensity * 0.1;
  const contrast = 1 - intensity * 0.12;
  const blur = 1.8 + intensity * 5;
  const opacity = Math.min(0.98, 0.68 + intensity * 0.22);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, featheredMask, opacity);
}

export function simulateCrowsFeetBotox(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);
  const featheredMask = featherMask(maskCanvas, 16);

  const brighten = 1 + intensity * 0.08;
  const contrast = 1 - intensity * 0.08;
  const blur = 1.5 + intensity * 4;
  const opacity = Math.min(0.95, 0.62 + intensity * 0.2);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, featheredMask, opacity);
}

export function simulateChemicalPeel(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);
  const featheredMask = featherMask(maskCanvas, 28);

  const brighten = 1 + intensity * 0.18;
  const contrast = 1 - intensity * 0.06;
  const saturate = 1 + intensity * 0.1;
  const blur = 2 + intensity * 4.5;
  const opacity = Math.min(0.98, 0.72 + intensity * 0.2);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, featheredMask, opacity);
}

export function applyTreatmentEffect(procedure, sourceCanvas, maskCanvas, level = 'moderate') {
  switch (procedure) {
    case 'underEyeFiller':
      return simulateUnderEyeFiller(sourceCanvas, maskCanvas, level);

    case 'laserEye':
      return simulateLaserResurfacing(sourceCanvas, maskCanvas, level);

    case 'lipFiller':
      return simulateLipFiller(sourceCanvas, maskCanvas, level);

    case 'lipFlip':
      return simulateLipFlip(sourceCanvas, maskCanvas, level);

    case 'foreheadBotox':
      return simulateForeheadBotox(sourceCanvas, maskCanvas, level);

    case 'glabella':
      return simulateGlabellaBotox(sourceCanvas, maskCanvas, level);

    case 'crowsfeet':
      return simulateCrowsFeetBotox(sourceCanvas, maskCanvas, level);

    case 'chemicalPeel':
      return simulateChemicalPeel(sourceCanvas, maskCanvas, level);

    default:
      return cloneCanvas(sourceCanvas);
  }
}
