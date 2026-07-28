// =========================================================
// AESTHETIQ
// FACE MEASUREMENTS ENGINE
// =========================================================

function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function average(points) {
  let x = 0;
  let y = 0;

  points.forEach(point => {
    x += point.x;
    y += point.y;
  });

  return {
    x: x / points.length,
    y: y / points.length
  };
}

// =========================================================
// FRONT FACE MEASUREMENTS
// =========================================================

export function measureFrontFace(
  landmarks
) {
  const leftCorner =
    landmarks[61];

  const rightCorner =
    landmarks[291];

  const upperLip =
    landmarks[13];

  const lowerLip =
    landmarks[14];

  const noseBase =
    landmarks[2];

  const chin =
    landmarks[152];

  const forehead =
    landmarks[10];

  const leftCheek =
    landmarks[234];

  const rightCheek =
    landmarks[454];

  const faceHeight =
    distance(
      forehead,
      chin
    );

  const mouthWidth =
    distance(
      leftCorner,
      rightCorner
    );

  const lipHeight =
    distance(
      upperLip,
      lowerLip
    );

  const cheekWidth =
    distance(
      leftCheek,
      rightCheek
    );

  const philtrumLength =
    distance(
      noseBase,
      upperLip
    );

  return {
    faceHeight,
    cheekWidth,
    mouthWidth,
    lipHeight,
    philtrumLength
  };
}

// =========================================================
// PROFILE MEASUREMENTS
// =========================================================

export function measureProfileFace(
  landmarks
) {
  const noseTip =
    landmarks[1];

  const chin =
    landmarks[152];

  const forehead =
    landmarks[10];

  const upperLip =
    landmarks[13];

  const faceDepth =
    Math.abs(
      noseTip.z -
      chin.z
    );

  const lipProjection =
    Math.abs(
      upperLip.z -
      chin.z
    );

  const chinProjection =
    Math.abs(
      chin.z -
      forehead.z
    );

  const noseProjection =
    Math.abs(
      noseTip.z -
      forehead.z
    );

  return {
    faceDepth,
    lipProjection,
    chinProjection,
    noseProjection
  };
}

// =========================================================
// COMBINE PRECISION SCAN MEASUREMENTS
// =========================================================

export function buildFaceMeasurements(
  captures
) {
  const front =
    measureFrontFace(
      captures.straight.landmarks
    );

  const left =
    measureProfileFace(
      captures.left.landmarks
    );

  const right =
    measureProfileFace(
      captures.right.landmarks
    );

  return {
    ...front,

    faceDepth:
      (
        left.faceDepth +
        right.faceDepth
      ) / 2,

    lipProjection:
      (
        left.lipProjection +
        right.lipProjection
      ) / 2,

    chinProjection:
      (
        left.chinProjection +
        right.chinProjection
      ) / 2,

    noseProjection:
      (
        left.noseProjection +
        right.noseProjection
      ) / 2
  };
}
