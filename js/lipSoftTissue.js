/*
=========================================================
AesthetIQ
Lip Soft Tissue Deformation
=========================================================
*/

export function blendLipSoftTissue(
  original,
  warped,
  strength = 0.22
) {
  if (
    !Array.isArray(original) ||
    !Array.isArray(warped)
  ) {
    return warped;
  }

  const result = warped.map(point => ({
    ...point
  }));

  const ring = [
    164,167,165,92,186,
    57,43,106,182,83,
    18,313,406,335,273,
    287,410,322
  ];

  ring.forEach(index => {

    const originalPoint =
      original[index];

    const warpedPoint =
      warped[index];

    if (
      !originalPoint ||
      !warpedPoint
    ) {
      return;
    }

    const dx =
      warpedPoint.x -
      originalPoint.x;

    const dy =
      warpedPoint.y -
      originalPoint.y;

    result[index] = {
      ...warpedPoint,

      x:
        originalPoint.x +
        dx * strength,

      y:
        originalPoint.y +
        dy * strength
    };

  });

  return result;
}
