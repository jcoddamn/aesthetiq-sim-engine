export function getIntensityValue(level) {
  if (level === 'subtle') return 0.6;
  if (level === 'moderate') return 1.2;
  if (level === 'extreme') return 2.0;
  return 1.2;
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

  const brighten = 1 + intensity * 0.22;
  const contrast = 1 - intensity * 0.12;
  const blur = 1 + intensity * 3.2;
  const opacity = Math.min(0.95, 0.72 + intensity * 0.18);

  const effectCanvas = createEffectLayer(
    sourceCanvas,
    `brightness(${brighten}) contrast(${contrast}) blur(${blur}px)`
  );

  return applyMaskedLayer(sourceCanvas, effectCanvas, maskCanvas, opacity);
}

export function simulateLaserResurfacing(sourceCanvas, maskCanvas, level = 'moderate') {
  const intensity = getIntensityValue(level);

  const brighten = 1 + intensity * 0.12;
  const contrast = 1 - intensity * 0.1;
  const saturate =
