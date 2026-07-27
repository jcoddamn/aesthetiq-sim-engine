// =========================================================
// AESTHETIQ — LIP BIOMECHANICS
// File: js/lipBiomechanics.js
// =========================================================

function cloneLandmarks(landmarks) {
  return landmarks.map((point) => ({
    ...point
  }));
}

function clamp(value, minimum, maximum) {
  return Math.max(
    minimum,
    Math.min(maximum, value)
  );
}

function getLevelConfig(level) {
  if (level === "natural") {
    return {
      upperRoll: 0.00065,
      lowerRoll: 0.00085,
      centerProjection: 0.00075,
      philtrumSupport: 0.1,
      lowerSupport: 0.12
    };
  }

  if (level === "enhanced") {
    return {
      upperRoll: 0.00165,
      lowerRoll: 0.0021,
      centerProjection: 0.0019,
      philtrumSupport: 0.24,
      lowerSupport: 0.28
    };
  }

  return {
    upperRoll: 0.0011,
    lowerRoll: 0.0014,
    centerProjection: 0.00125,
    philtrumSupport: 0.17,
    lowerSupport: 0.2
  };
}

/*
 * Weight is strongest in the middle of the mouth and
 * approaches zero near the corners.
 */
function getCenterWeight(
  point,
  centerX,
  halfMouthWidth,
  exponent = 1.35
) {
  const normalizedDistance =
    clamp(
      Math.abs(
        point.x - centerX
      ) / halfMouthWidth,
      0,
      1
    );

  return Math.pow(
    1 - normalizedDistance,
    exponent
  );
}

function moveSupportGroup({
  result,
  original,
  indices,
  deltaX,
  deltaY,
  strength
}) {
  indices.forEach((index) => {
    const originalPoint =
      original[index];

    const currentPoint =
      result[index];

    if (
      !originalPoint ||
      !currentPoint
    ) {
      return;
    }

    result[index] = {
      ...currentPoint,

      x:
        currentPoint.x +
        deltaX *
        strength,

      y:
        currentPoint.y +
        deltaY *
        strength
    };
  });
}

export function applyLipBiomechanics(
  originalLandmarks,
  warpedLandmarks,
  level = "balanced",
  anatomyStrength = 1
) {
  if (
    !Array.isArray(originalLandmarks) ||
    !Array.isArray(warpedLandmarks) ||
    originalLandmarks.length < 468 ||
    warpedLandmarks.length < 468
  ) {
    return warpedLandmarks;
  }

  const result =
    cloneLandmarks(
      warpedLandmarks
    );

  const baseConfig =
  getLevelConfig(level);

const config = {
  ...baseConfig,

  upperRoll:
    baseConfig.upperRoll *
    anatomyStrength,

  centerProjection:
    baseConfig.centerProjection *
    anatomyStrength,

  philtrumSupport:
    baseConfig.philtrumSupport *
    anatomyStrength
};

  const leftCorner =
    originalLandmarks[61];

  const rightCorner =
    originalLandmarks[291];

  const originalUpperCenter =
    originalLandmarks[13];

  const originalLowerCenter =
    originalLandmarks[14];

  const warpedUpperCenter =
    warpedLandmarks[13];

  const warpedLowerCenter =
    warpedLandmarks[14];

  if (
    !leftCorner ||
    !rightCorner ||
    !originalUpperCenter ||
    !originalLowerCenter ||
    !warpedUpperCenter ||
    !warpedLowerCenter
  ) {
    return result;
  }

  const centerX =
    (
      leftCorner.x +
      rightCorner.x
    ) / 2;

  const centerY =
    (
      originalUpperCenter.y +
      originalLowerCenter.y
    ) / 2;

  const halfMouthWidth =
    Math.max(
      0.0001,
      Math.abs(
        rightCorner.x -
        leftCorner.x
      ) / 2
    );

  const upperOuter = [
    61, 185, 40, 39, 37,
    0, 267, 269, 270, 409, 291
  ];

  const upperInner = [
    78, 191, 80, 81, 82,
    13, 312, 311, 310, 415, 308
  ];

  const lowerOuter = [
    61, 146, 91, 181, 84,
    17, 314, 405, 321, 375, 291
  ];

  const lowerInner = [
    78, 95, 88, 178, 87,
    14, 317, 402, 318, 324, 308
  ];

  /*
   * Roll the visible upper lip outward.
   * The center receives the most motion while the
   * corners remain nearly anchored.
   */
  upperOuter.forEach((index) => {
    if (
      index === 61 ||
      index === 291
    ) {
      return;
    }

    const point =
      result[index];

    if (!point) {
      return;
    }

    const weight =
      getCenterWeight(
        point,
        centerX,
        halfMouthWidth
      );

    const sideDirection =
      point.x < centerX
        ? -1
        : 1;

    result[index] = {
      ...point,

      x:
        point.x +
        sideDirection *
        config.upperRoll *
        weight *
        0.35,

      y:
        point.y -
        config.upperRoll *
        weight
    };
  });

  /*
   * Keep the inner upper contour closer to the mouth
   * opening so the lips roll instead of simply separating.
   */
  upperInner.forEach((index) => {
    if (
      index === 78 ||
      index === 308
    ) {
      return;
    }

    const point =
      result[index];

    if (!point) {
      return;
    }

    const weight =
      getCenterWeight(
        point,
        centerX,
        halfMouthWidth,
        1.55
      );

    result[index] = {
      ...point,

      y:
        point.y -
        config.upperRoll *
        weight *
        0.22
    };
  });

  /*
   * The lower lip receives slightly more projection than
   * the upper lip to preserve a natural upper/lower ratio.
   */
  lowerOuter.forEach((index) => {
    if (
      index === 61 ||
      index === 291
    ) {
      return;
    }

    const point =
      result[index];

    if (!point) {
      return;
    }

    const weight =
      getCenterWeight(
        point,
        centerX,
        halfMouthWidth
      );

    const sideDirection =
      point.x < centerX
        ? -1
        : 1;

    result[index] = {
      ...point,

      x:
        point.x +
        sideDirection *
        config.lowerRoll *
        weight *
        0.3,

      y:
        point.y +
        config.lowerRoll *
        weight
    };
  });

  lowerInner.forEach((index) => {
    if (
      index === 78 ||
      index === 308
    ) {
      return;
    }

    const point =
      result[index];

    if (!point) {
      return;
    }

    const weight =
      getCenterWeight(
        point,
        centerX,
        halfMouthWidth,
        1.55
      );

    result[index] = {
      ...point,

      y:
        point.y +
        config.lowerRoll *
        weight *
        0.2
    };
  });

  /*
   * Add concentrated central projection without opening
   * the entire mouth.
   */
  const upperProjectionPoints = [
    37, 0, 267,
    82, 13, 312
  ];

  const lowerProjectionPoints = [
    84, 17, 314,
    87, 14, 317
  ];

  upperProjectionPoints.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const weight =
      getCenterWeight(
        point,
        centerX,
        halfMouthWidth,
        1.8
      );

    result[index] = {
      ...point,

      y:
        point.y -
        config.centerProjection *
        weight
    };
  });

  lowerProjectionPoints.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const weight =
      getCenterWeight(
        point,
        centerX,
        halfMouthWidth,
        1.8
      );

    result[index] = {
      ...point,

      y:
        point.y +
        config.centerProjection *
        weight *
        1.15
    };
  });

  /*
   * Calculate how much the central lip moved so nearby
   * tissue can follow by a smaller amount.
   */
  const upperDeltaX =
    warpedUpperCenter.x -
    originalUpperCenter.x;

  const upperDeltaY =
    warpedUpperCenter.y -
    originalUpperCenter.y;

  const lowerDeltaX =
    warpedLowerCenter.x -
    originalLowerCenter.x;

  const lowerDeltaY =
    warpedLowerCenter.y -
    originalLowerCenter.y;

  const philtrumPoints = [
    164, 167, 165, 92,
    186, 57, 43, 106,
    182, 83
  ];

  const lowerTransitionPoints = [
    18, 200, 199, 175,
    208, 201, 194,
    428, 421, 418
  ];

  moveSupportGroup({
    result,
    original:
      originalLandmarks,

    indices:
      philtrumPoints,

    deltaX:
      upperDeltaX,

    deltaY:
      upperDeltaY,

    strength:
      config.philtrumSupport
  });

  moveSupportGroup({
    result,
    original:
      originalLandmarks,

    indices:
      lowerTransitionPoints,

    deltaX:
      lowerDeltaX,

    deltaY:
      lowerDeltaY,

    strength:
      config.lowerSupport
  });

  /*
   * Re-anchor the mouth corners to prevent widening.
   */
  result[61] = {
    ...warpedLandmarks[61],
    x:
      originalLandmarks[61].x +
      (
        warpedLandmarks[61].x -
        originalLandmarks[61].x
      ) * 0.18
  };

  result[291] = {
    ...warpedLandmarks[291],
    x:
      originalLandmarks[291].x +
      (
        warpedLandmarks[291].x -
        originalLandmarks[291].x
      ) * 0.18
  };

  /*
   * Keep major facial anchors fixed.
   */
  [1, 4, 152].forEach((index) => {
    if (originalLandmarks[index]) {
      result[index] = {
        ...originalLandmarks[index]
      };
    }
  });

  return result;
}
