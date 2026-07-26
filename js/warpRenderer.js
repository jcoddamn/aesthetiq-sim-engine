// =========================================================
// AESTHETIQ
// Warp Renderer
// Version 1
// =========================================================

export function renderWarp(
  sourceCanvas,
  originalLandmarks,
  warpedLandmarks
) {

  if (
    !sourceCanvas ||
    !originalLandmarks ||
    !warpedLandmarks
  ) {
    return sourceCanvas;
  }

  // Version 1 simply returns the original image.
  // Future versions will perform mesh warping.

  return sourceCanvas;

}
