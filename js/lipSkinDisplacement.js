// ==========================================================
// AESTHETIQ — LIP SKIN DISPLACEMENT V2
// File: js/lipSkinDisplacement.js
// ==========================================================

function cloneLandmarks(landmarks) {
  return landmarks.map((point) => ({
    ...point
  }));
}

function gaussianWeight(
  distance,
  radius
) {
  if (
    !Number.isFinite(distance) ||
    !Number.isFinite(radius) ||
    radius <= 0
  ) {
    return 0;
  }

  return Math.exp(
    -(
      distance * distance
    ) /
    (
      2 *
      radius *
      radius
    )
  );
}

function getDistance(
  first,
  second
) {
  const deltaX =
    first.x - second.x;

  const deltaY =
    first.y - second.y;

  return Math.sqrt(
    deltaX * deltaX +
    deltaY * deltaY
  );
}

export function displaceLipSkin(
  originalLandmarks,
  warpedLandmarks,
  strength = 0.24
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

  /*
   * Lip points that drive the surrounding tissue.
   * Their displacement is transferred outward with
   * a smooth Gaussian falloff.
   */
  const lipDriverPoints = [
    // Outer upper lip
    61, 185, 40, 39, 37,
    0, 267, 269, 270, 409, 291,

    // Outer lower lip
    146, 91, 181, 84,
    17, 314, 405, 321, 375,

    // Inner lip support
    78, 191, 80, 81, 82,
    13, 312, 311, 310, 415, 308,
    95, 88, 178, 87,
    14, 317, 402, 318, 324
  ];

  /*
   * Skin surrounding the lips.
   * These points should move subtly, not as much as
   * the actual vermilion.
   */
  const upperSkinPoints = [
    164, 167, 165, 92, 186,
    57, 43, 106, 182, 83,
    18, 313, 406, 335, 273,
    287, 410, 322, 391, 393
  ];

  const sideSkinPoints = [
    // Left transition
    205, 50, 187, 207,
    206, 203, 129, 202, 214,

    // Right transition
    425, 280, 411, 427,
    426, 423, 358, 422, 434
  ];

  const lowerSkinPoints = [
    200, 199, 175, 152,
    208, 201, 194,
    428, 421, 418
  ];

  const skinGroups = [
    {
      indices:
        upperSkinPoints,

      radius:
        0.085,

      multiplier:
        0.82
    },

    {
      indices:
        sideSkinPoints,

      radius:
        0.1,

      multiplier:
        0.46
    },

    {
      indices:
        lowerSkinPoints,

      radius:
        0.11,

      multiplier:
        0.58
    }
  ];

  skinGroups.forEach(
    ({
      indices,
      radius,
      multiplier
    }) => {
      indices.forEach((skinIndex) => {
        const originalSkinPoint =
          originalLandmarks[
            skinIndex
          ];

        if (!originalSkinPoint) {
          return;
        }

        let totalWeight = 0;
        let displacementX = 0;
        let displacementY = 0;

        lipDriverPoints.forEach(
          (driverIndex) => {
            const originalDriver =
              originalLandmarks[
                driverIndex
              ];

            const warpedDriver =
              warpedLandmarks[
                driverIndex
              ];

            if (
              !originalDriver ||
              !warpedDriver
            ) {
              return;
            }

            const distance =
              getDistance(
                originalSkinPoint,
                originalDriver
              );

            const weight =
              gaussianWeight(
                distance,
                radius
              );

            if (weight < 0.002) {
              return;
            }

            const driverDeltaX =
              warpedDriver.x -
              originalDriver.x;

            const driverDeltaY =
              warpedDriver.y -
              originalDriver.y;

            displacementX +=
              driverDeltaX *
              weight;

            displacementY +=
              driverDeltaY *
              weight;

            totalWeight +=
              weight;
          }
        );

        if (totalWeight <= 0) {
          return;
        }

        const normalizedX =
          displacementX /
          totalWeight;

        const normalizedY =
          displacementY /
          totalWeight;

        /*
         * Horizontal movement is reduced more heavily
         * to avoid widening the mouth and cheeks.
         */
        result[skinIndex] = {
          ...result[skinIndex],

          x:
            originalSkinPoint.x +
            normalizedX *
            strength *
            multiplier *
            0.55,

          y:
            originalSkinPoint.y +
            normalizedY *
            strength *
            multiplier
        };
      });
    }
  );

  /*
   * Keep major facial anchors fixed.
   * This prevents the nose, chin tip, and mouth corners
   * from drifting with the surrounding tissue.
   */
  const anchorPoints = [
    1,   // nose tip
    4,   // lower nose
    152, // chin tip
    61,  // left mouth corner
    291  // right mouth corner
  ];

  anchorPoints.forEach((index) => {
    if (!originalLandmarks[index]) {
      return;
    }

    /*
     * Preserve the warped lips at the mouth corners,
     * but do not apply additional skin displacement.
     */
    if (
      index === 61 ||
      index === 291
    ) {
      result[index] = {
        ...warpedLandmarks[index]
      };

      return;
    }

    result[index] = {
      ...originalLandmarks[index]
    };
  });

  return result;
}
