// =========================================================
// AESTHETIQ — MULTI-ANGLE ANATOMY FUSION
// File: js/anatomyFusion.js
// =========================================================

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.max(
    minimum,
    Math.min(maximum, value)
  );
}

function safePoint(
  landmarks,
  index
) {
  return landmarks?.[index] || null;
}

function distance(
  first,
  second
) {
  if (!first || !second) {
    return 0;
  }

  return Math.hypot(
    first.x - second.x,
    first.y - second.y
  );
}

function getFaceWidth(
  landmarks
) {
  return distance(
    safePoint(landmarks, 234),
    safePoint(landmarks, 454)
  );
}

function getMouthWidth(
  landmarks
) {
  return distance(
    safePoint(landmarks, 61),
    safePoint(landmarks, 291)
  );
}

function getLipHeight(
  landmarks
) {
  return distance(
    safePoint(landmarks, 13),
    safePoint(landmarks, 14)
  );
}

function getChinLength(
  landmarks
) {
  return distance(
    safePoint(landmarks, 1),
    safePoint(landmarks, 152)
  );
}

function getNoseOffset(
  landmarks
) {
  const nose =
    safePoint(landmarks, 1);

  const left =
    safePoint(landmarks, 234);

  const right =
    safePoint(landmarks, 454);

  if (
    !nose ||
    !left ||
    !right
  ) {
    return 0;
  }

  const centerX =
    (
      left.x +
      right.x
    ) / 2;

  const faceWidth =
    Math.max(
      0.0001,
      Math.abs(
        right.x -
        left.x
      )
    );

  return (
    nose.x -
    centerX
  ) / faceWidth;
}

export function analyzeMultiAngleCaptures(
  captures
) {
  const straight =
    captures?.straight?.landmarks;

  const left =
    captures?.left?.landmarks;

  const right =
    captures?.right?.landmarks;

  if (
    !Array.isArray(straight) ||
    straight.length < 468
  ) {
    return {
      valid: false,
      anatomyStrength: 1,
      projectionStrength: 1,
      symmetryStrength: 1
    };
  }

  const straightFaceWidth =
    getFaceWidth(straight);

  const straightMouthWidth =
    getMouthWidth(straight);

  const straightLipHeight =
    getLipHeight(straight);

  const straightChinLength =
    getChinLength(straight);

  const leftFaceWidth =
    Array.isArray(left)
      ? getFaceWidth(left)
      : straightFaceWidth;

  const rightFaceWidth =
    Array.isArray(right)
      ? getFaceWidth(right)
      : straightFaceWidth;

  const averageSideWidth =
    (
      leftFaceWidth +
      rightFaceWidth
    ) / 2;

  const projectionRatio =
    straightFaceWidth > 0
      ? averageSideWidth /
        straightFaceWidth
      : 1;

  const leftNoseOffset =
    Array.isArray(left)
      ? Math.abs(
          getNoseOffset(left)
        )
      : 0;

  const rightNoseOffset =
    Array.isArray(right)
      ? Math.abs(
          getNoseOffset(right)
        )
      : 0;

  const averageYawEvidence =
    (
      leftNoseOffset +
      rightNoseOffset
    ) / 2;

  const sideBalance =
    Math.abs(
      leftNoseOffset -
      rightNoseOffset
    );

  const lipToMouthRatio =
    straightMouthWidth > 0
      ? straightLipHeight /
        straightMouthWidth
      : 0;

  const chinToFaceRatio =
    straightFaceWidth > 0
      ? straightChinLength /
        straightFaceWidth
      : 0;

  const anatomyStrength =
    clamp(
      0.9 +
      lipToMouthRatio * 1.6,
      0.85,
      1.18
    );

  const projectionStrength =
    clamp(
      0.9 +
      averageYawEvidence * 1.4 +
      (
        1 -
        projectionRatio
      ) * 0.5,
      0.9,
      1.2
    );

  const symmetryStrength =
    clamp(
      1 -
      sideBalance * 1.8,
      0.88,
      1
    );

  const chinStrength =
    clamp(
      0.9 +
      chinToFaceRatio * 0.35,
      0.9,
      1.15
    );

  return {
    valid: true,

    anatomyStrength,
    projectionStrength,
    symmetryStrength,
    chinStrength,

    measurements: {
      straightFaceWidth,
      straightMouthWidth,
      straightLipHeight,
      straightChinLength,
      lipToMouthRatio,
      chinToFaceRatio,
      projectionRatio,
      leftNoseOffset,
      rightNoseOffset,
      sideBalance
    }
  };
}
