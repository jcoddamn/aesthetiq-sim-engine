export const REGION_POINTS = {
  leftUnderEye: [33, 7, 163, 144, 145, 153, 154, 155, 133],
  rightUnderEye: [263, 249, 390, 373, 374, 380, 381, 382, 362],

  lipsOuter: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308],

  leftBrow: [70, 63, 105, 66, 107],
  rightBrow: [336, 296, 334, 293, 300],

  glabella: [55, 65, 52, 168, 285, 295, 282, 8],

  leftCrowsFeet: [33, 246, 161, 160, 159, 158, 157, 173],
  rightCrowsFeet: [263, 466, 388, 387, 386, 385, 384, 398],

  faceOval: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361,
    288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149,
    150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103,
    67, 109
  ]
};

export function toPixel(pt, width, height) {
  return {
    x: pt.x * width,
    y: pt.y * height
  };
}

export function pointsFromIndices(indices, landmarks, width, height) {
  return indices.map((i) => toPixel(landmarks[i], width, height));
}

export function getPolygonCenter(points) {
  let x = 0;
  let y = 0;

  for (const p of points) {
    x += p.x;
    y += p.y;
  }

  return {
    x: x / points.length,
    y: y / points.length
  };
}

export function smoothPoints(points) {
  return points.map((p, i, arr) => {
    const prev = arr[(i - 1 + arr.length) % arr.length];
    const next = arr[(i + 1) % arr.length];

    return {
      x: (prev.x + p.x + next.x) / 3,
      y: (prev.y + p.y + next.y) / 3
    };
  });
}

export function buildExpandedRibbon(indices, landmarks, width, height, drop = 18) {
  const top = pointsFromIndices(indices, landmarks, width, height);
  const bottom = top.map((p) => ({
    x: p.x,
    y: p.y + drop
  })).reverse();

  return smoothPoints([...top, ...bottom]);
}

export function buildForeheadBand(landmarks, width, height, rise = 68) {
  const left = pointsFromIndices(REGION_POINTS.leftBrow, landmarks, width, height);
  const right = pointsFromIndices(REGION_POINTS.rightBrow, landmarks, width, height);

  const brow = [...left, ...right];
  const center = getPolygonCenter(brow);

  const upper = brow.map((p) => {
    const dx = p.x - center.x;
    const norm = Math.min(1, Math.abs(dx) / (width * 0.23));

    const sideDrop = norm * 42;
    const taper = 1 - norm * 0.7;
    const centerLift = (1 - norm) * 6;

    return {
      x: p.x - dx * 0.06,
      y: p.y - (rise * taper) + sideDrop - centerLift + 6
    };
  }).reverse();

  return smoothPoints([...brow, ...upper]);
}

export function buildGlabellaMask(landmarks, width, height) {
  const pts = pointsFromIndices(REGION_POINTS.glabella, landmarks, width, height);
  const center = getPolygonCenter(pts);

  const shaped = pts.map((p) => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;

    return {
      // 🔥 shrink horizontal
      x: center.x + dx * 0.6,

      // 🔥 stretch vertical
      y: center.y + dy * 2.2
    };
  });

  return smoothPoints(shaped);
}

export function buildCrowsFeetMask(indices, landmarks, width, height, xShift = 12, yShift = 8) {
  const pts = pointsFromIndices(indices, landmarks, width, height);

  const shifted = pts.map((p) => ({
    x: p.x + xShift,
    y: p.y + yShift
  }));

  return smoothPoints(shifted);
}

export function buildUpperLipMask(landmarks, width, height, lift = 6) {
  const pts = pointsFromIndices(REGION_POINTS.lipsOuter, landmarks, width, height);
  const upperHalf = pts.slice(0, 7);

  const lowerEdge = upperHalf.map((p) => ({
    x: p.x,
    y: p.y - lift
  })).reverse();

  return smoothPoints([...upperHalf, ...lowerEdge]);
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
      return [
        pointsFromIndices(REGION_POINTS.lipsOuter, landmarks, width, height)
      ];

    case 'lipFlip':
      return [
        buildUpperLipMask(landmarks, width, height, 6)
      ];

    case 'foreheadBotox':
      return [
        buildForeheadBand(landmarks, width, height, 68)
      ];

    case 'glabella':
      return [
        buildGlabellaMask(landmarks, width, height, 12, 18)
      ];

    case 'crowsfeet':
      return [
        buildCrowsFeetMask(REGION_POINTS.leftCrowsFeet, landmarks, width, height, -10, 8),
        buildCrowsFeetMask(REGION_POINTS.rightCrowsFeet, landmarks, width, height, 10, 8)
      ];

    case 'chemicalPeel':
      return [
        pointsFromIndices(REGION_POINTS.faceOval, landmarks, width, height)
      ];

    default:
      return [];
  }
}
