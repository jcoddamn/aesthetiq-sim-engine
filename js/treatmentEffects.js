export function getIntensityValue(level) {
  if (level === 'subtle') return 0.25;
  if (level === 'moderate') return 0.5;
  if (level === 'extreme') return 0.8;
  return 0.5;
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

export function simulateUnderEyeFiller(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${1 + intensity * 0.15}) contrast(${1 - intensity * 0.08}) blur(${intensity * 1.8}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, 0.75 + intensity * 0.15);
}

export function simulateLaserResurfacing(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${1 + intensity * 0.08}) contrast(${1 - intensity * 0.06}) saturate(${1 + intensity * 0.04}) blur(${1 + intensity * 2.2}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, 0.7 + intensity * 0.2);
}

export function simulateLipFiller(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `saturate(${1 + intensity * 0.25}) brightness(${1 + intensity * 0.06}) contrast(${1 + intensity * 0.04})`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, 0.65 + intensity * 0.2);
}

export function simulateLipFlip(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${1 + intensity * 0.04}) saturate(${1 + intensity * 0.12}) blur(${intensity * 0.8}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, 0.55 + intensity * 0.2);
}

export function simulateForeheadBotox(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${1 + intensity * 0.05}) contrast(${1 - intensity * 0.05}) blur(${1 + intensity * 2.5}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, 0.6 + intensity * 0.2);
}

export function simulateGlabellaBotox(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${1 + intensity * 0.04}) contrast(${1 - intensity * 0.04}) blur(${1 + intensity * 2}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, 0.62 + intensity * 0.18);
}

export function simulateCrowsFeetBotox(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${1 + intensity * 0.05}) contrast(${1 - intensity * 0.05}) blur(${1 + intensity * 1.8}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, 0.58 + intensity * 0.2);
}

export function simulateChemicalPeel(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${1 + intensity * 0.12}) contrast(${1 - intensity * 0.03}) saturate(${1 + intensity * 0.05}) blur(${1 + intensity * 1.6}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, 0.7 + intensity * 0.18);
}

export function applyTreatmentEffect(procedure, sourceCanvas, maskCanvas, level = 'moderate') {
  switch (procedure) {
    case 'underEyeFiller': return simulateUnderEyeFiller(sourceCanvas, maskCanvas, level);
    case 'laserEye': return simulateLaserResurfacing(sourceCanvas, maskCanvas, level);
    case 'lipFiller': return simulateLipFiller(sourceCanvas, maskCanvas, level);
    case 'lipFlip': return simulateLipFlip(sourceCanvas, maskCanvas, level);
    case 'foreheadBotox': return simulateForeheadBotox(sourceCanvas, maskCanvas, level);
    case 'glabella': return simulateGlabellaBotox(sourceCanvas, maskCanvas, level);
    case 'crowsfeet': return simulateCrowsFeetBotox(sourceCanvas, maskCanvas, level);
    case 'chemicalPeel': return simulateChemicalPeel(sourceCanvas, maskCanvas, level);
    default: return cloneCanvas(sourceCanvas);
  }
}
