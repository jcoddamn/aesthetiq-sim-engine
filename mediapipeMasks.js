export const REGION_POINTS = {
  leftUnderEye: [33, 7, 163, 144, 145, 153, 154, 155, 133],
  rightUnderEye: [263, 249, 390, 373, 374, 380, 381, 382, 362],
  lipsOuter: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308],
  leftBrow: [70, 63, 105, 66, 107],
  rightBrow: [336, 296, 334, 293, 300],
  faceOval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
};

export function toPixel(pt, width, height) {
  return {
    x: pt.x * width,
    y: pt.y * height
  };
}

export function pointsFromIndices(indices, landmarks, width, height) {
  return indices.map(i => toPixel(landmarks[i], width, height));
}

export function buildExpandedRibbon(indices, landmarks, width, height, drop = 18) {
  const top = pointsFromIndices(indices, landmarks, width, height);
  const bottom = top.map(p => ({ x: p.x, y: p.y + drop })).reverse();
  return [...top, ...bottom];
}

export function buildForeheadBand(landmarks, width, height, rise = 55) {
  const brow = [
    ...pointsFromIndices(REGION_POINTS.leftBrow, landmarks, width, height),
    ...pointsFromIndices(REGION_POINTS.rightBrow, landmarks, width, height)
  ];

  const upper = brow.map(p => ({
    x: p.x,
    y: p.y - rise
  })).reverse();

  return [...brow, ...upper];
}

export function getProcedureMask(procedure, landmarks, width, height) {
  switch (procedure) {
    case 'underEyeFiller':
    case 'laserEye':
      return [
        buildExpandedRibbon(REGION_POINTS.leftUnderEye, landmarks, width, height, 18),
        buildExpandedRibbon(REGION_POINTS.rightUnderEye, landmarks, width, height, 18)
      ];

    case 'lipFiller':
    case 'lipLift':
      return [
        pointsFromIndices(REGION_POINTS.lipsOuter, landmarks, width, height)
      ];

    case 'foreheadBotox':
      return [
        buildForeheadBand(landmarks, width, height, 55)
      ];

    case 'chemicalPeel':
      return [
        pointsFromIndices(REGION_POINTS.faceOval, landmarks, width, height)
      ];

    default:
      return [];
  }
}
