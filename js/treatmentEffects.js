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

  const brighten = 1 + intensity * 0.15;
  const contrast = 1 - intensity * 0.08;
  const blur = intensity * 1.8;
  const opacity = 0.75 + intensity * 0.15;

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, opacity);
}

export function simulateLaserResurfacing(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const brighten = 1 + intensity * 0.08;
  const contrast = 1 - intensity * 0.06;
  const blur = 1 + intensity * 2.2;
  const saturate = 1 + intensity * 0.04;
  const opacity = 0.7 + intensity * 0.2;

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, opacity);
}

export function simulateLipFiller(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const saturate = 1 + intensity * 0.25;
  const brighten = 1 + intensity * 0.06;
  const contrast = 1 + intensity * 0.04;
  const opacity = 0.65 + intensity * 0.2;

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `saturate(${saturate}) brightness(${brighten}) contrast(${contrast})`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, opacity);
}

export function simulateLipFlip(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const brighten = 1 + intensity * 0.04;
  const saturate = 1 + intensity * 0.12;
  const blur = intensity * 0.8;
  const opacity = 0.55 + intensity * 0.2;

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) saturate(${saturate}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, opacity);
}

export function simulateForeheadBotox(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const brighten = 1 + intensity * 0.05;
  const contrast = 1 - intensity * 0.05;
  const blur = 1 + intensity * 2.5;
  const opacity = 0.6 + intensity * 0.2;

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, opacity);
}

export function simulateGlabellaBotox(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const brighten = 1 + intensity * 0.04;
  const contrast = 1 - intensity * 0.04;
  const blur = 1 + intensity * 2;
  const opacity = 0.62 + intensity * 0.18;

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, opacity);
}

export function simulateCrowsFeetBotox(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const brighten = 1 + intensity * 0.05;
  const contrast = 1 - intensity * 0.05;
  const blur = 1 + intensity * 1.8;
  const opacity = 0.58 + intensity * 0.2;

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, opacity);
}

export function simulateChemicalPeel(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const brighten = 1 + intensity * 0.12;
  const contrast = 1 - intensity * 0.03;
  const saturate = 1 + intensity * 0.05;
  const blur = 1 + intensity * 1.6;
  const opacity = 0.7 + intensity * 0.18;

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, opacity);
}

export function applyTreatmentEffect(procedure, sourceCanvas, maskCanvas, level = 'moderate') {
  switch (procedure) {
    case 'underEyeFiller':
    case 'under-eye-fillers':
      return simulateUnderEyeFiller(sourceCanvas, maskCanvas, level);

    case 'laserEye':
    case 'laser-resurfacing-under-eyes':
      return simulateLaserResurfacing(sourceCanvas, maskCanvas, level);

    case 'lipFiller':
    case 'lip-fillers':
      return simulateLipFiller(sourceCanvas, maskCanvas, level);

    case 'lipFlip':
    case 'lip-flip':
    case 'lipLift':
      return simulateLipFlip(sourceCanvas, maskCanvas, level);

    case 'foreheadBotox':
    case 'forehead-neuromodulator':
    case 'forehead':
      return simulateForeheadBotox(sourceCanvas, maskCanvas, level);

    case 'glabella':
    case '11-lines':
    case 'glabellaBotox':
      return simulateGlabellaBotox(sourceCanvas, maskCanvas, level);

    case 'crowsfeet':
    case 'crows-feet':
    case 'crowsFeetBotox':
      return simulateCrowsFeetBotox(sourceCanvas, maskCanvas, level);

    case 'chemicalPeel':
    case 'chemical-peel':
    case 'laserResurfacingFullFace':
      return simulateChemicalPeel(sourceCanvas, maskCanvas, level);

    default:
      return cloneCanvas(sourceCanvas);
  }
}
