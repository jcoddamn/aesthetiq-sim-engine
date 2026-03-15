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
  return createFeatheredMask(width, height, polygons, blurPx);
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
