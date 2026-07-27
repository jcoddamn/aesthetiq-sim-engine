import {
  getLipIntensityProfile
} from "./lipProfiles.js";

import {
  applyLipSoftTissue
} from "./lipSoftTissue.js";

import {
  displaceLipSkin
} from "./lipSkinDisplacement.js";

import {
  applyLipBiomechanics
} from "./lipBiomechanics.js";

/*
=========================================================
 AesthetIQ Face Warp Engine
 Version 1
=========================================================
*/

export function getCenter(points) {
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

export function movePoint(point, center, amount) {
  return {
    x: center.x + (point.x - center.x) * amount,
    y: center.y + (point.y - center.y) * amount
  };
}

export function warpRegion(landmarks, indices, strength = 1.0) {
  const region = indices.map(index => landmarks[index]);

  const center = getCenter(region);

  const warped = {};

  indices.forEach(index => {
    warped[index] = movePoint(
      landmarks[index],
      center,
      strength
    );
  });

  return warped;
}

export function mergeWarp(original, warped) {
  const result = [...original];

  Object.keys(warped).forEach(index => {
    result[index] = warped[index];
  });

  return result;
}

/*
=========================================================
Lip Enlargement
=========================================================
*/
export function warpLipFiller(
  landmarks,
  level = "balanced"
) {
  if (
    !Array.isArray(landmarks) ||
    landmarks.length < 468
  ) {
    return landmarks;
  }

  const profile =
    getLipIntensityProfile(level) || {};

  const levelStrength =
    level === "natural"
      ? 0.4
      : level === "enhanced"
      ? 0.82
      : 0.6;

  const upperVolume =
    Number.isFinite(profile.upperVolume)
      ? profile.upperVolume
      : 1;

  const lowerVolume =
    Number.isFinite(profile.lowerVolume)
      ? profile.lowerVolume
      : 1;

  const horizontalVolume =
    Number.isFinite(profile.horizontalVolume)
      ? profile.horizontalVolume
      : 1;

  const cupidBowStrength =
    Number.isFinite(profile.cupidBow)
      ? profile.cupidBow
      : 1;

  const borderStrength =
    Number.isFinite(profile.border)
      ? profile.border
      : 1;

  const tubercleStrength =
    Number.isFinite(profile.centralTubercle)
      ? profile.centralTubercle
      : 1;

  const cornerLift =
    Number.isFinite(profile.cornerLift)
      ? profile.cornerLift
      : 0;

  const result =
    landmarks.map((landmark) => ({
      ...landmark
    }));

  // Outer vermilion borders
  const upperOuter = [
    61, 185, 40, 39, 37,
    0, 267, 269, 270, 409, 291
  ];

  const lowerOuter = [
    61, 146, 91, 181, 84,
    17, 314, 405, 321, 375, 291
  ];

  // Inner wet-line contours
  const upperInner = [
    78, 191, 80, 81, 82,
    13, 312, 311, 310, 415, 308
  ];

  const lowerInner = [
    78, 95, 88, 178, 87,
    14, 317, 402, 318, 324, 308
  ];

  const upperCenterPoints = [
    39, 37, 0, 267, 269,
    81, 82, 13, 312, 311
  ];

  const lowerCenterPoints = [
    181, 84, 17, 314, 405,
    178, 87, 14, 317, 402
  ];

  const cupidBow = [
    37, 0, 267
  ];

  const mouthCorners = [
    61, 291
  ];

  const leftCorner =
    landmarks[61];

  const rightCorner =
    landmarks[291];

  const upperCenter =
    landmarks[13];

  const lowerCenter =
    landmarks[14];

  if (
    !leftCorner ||
    !rightCorner ||
    !upperCenter ||
    !lowerCenter
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
      upperCenter.y +
      lowerCenter.y
    ) / 2;

  const halfMouthWidth =
    Math.max(
      0.0001,
      Math.abs(
        rightCorner.x -
        leftCorner.x
      ) / 2
    );

  function moveGroup(
  indices,
  verticalDirection,
  verticalAmount,
  horizontalAmount,
  centerBoost = 0
) {
  indices.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const normalizedDistance =
      Math.min(
        1,
        Math.abs(
          point.x -
          centerX
        ) / halfMouthWidth
      );

    /*
     * Center points receive the most fullness.
     * Corners receive almost none.
     */
    const centerWeight =
      Math.pow(
        1 -
        normalizedDistance,
        1.35
      );

    const edgeWeight =
      Math.pow(
        normalizedDistance,
        1.8
      );

    const sideDirection =
      point.x < centerX
        ? -1
        : 1;

    /*
     * Vertical movement builds lip height.
     * It is strongest near the center and tapers
     * toward the corners.
     */
    const verticalWeight =
      0.18 +
      centerWeight *
      (
        0.82 +
        centerBoost
      );

    /*
     * Horizontal movement adds rounded projection,
     * but avoids stretching the mouth corners.
     */
    const horizontalWeight =
      centerWeight *
      (
        1 -
        edgeWeight
      );

    result[index] = {
      ...point,

      x:
        point.x +
        sideDirection *
        horizontalAmount *
        horizontalWeight,

      y:
        point.y +
        verticalDirection *
        verticalAmount *
        verticalWeight
    };
  });
}

 // Upper outer lip
moveGroup(
  upperOuter,
  -1,
  0.009 *
    upperVolume *
    levelStrength,
  0.0032 *
    horizontalVolume *
    levelStrength,
  0.2
);

// Upper inner lip
moveGroup(
  upperInner,
  -1,
  0.0024 *
    upperVolume *
    levelStrength,
  0.0012 *
    horizontalVolume *
    levelStrength,
  0.08
);

// Lower outer lip
moveGroup(
  lowerOuter,
  1,
  0.0105 *
    lowerVolume *
    levelStrength,
  0.0035 *
    horizontalVolume *
    levelStrength,
  0.24
);

// Lower inner lip
moveGroup(
  lowerInner,
  1,
  0.0028 *
    lowerVolume *
    levelStrength,
  0.0014 *
    horizontalVolume *
    levelStrength,
  0.1
);

  // Add rounded central projection.
  upperCenterPoints.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const distanceFromCenter =
      Math.abs(
        point.x -
        centerX
      ) / halfMouthWidth;

    const centerInfluence =
      Math.max(
        0,
        1 -
        distanceFromCenter
      );

    result[index] = {
      ...point,
      y:
        point.y -
        0.0018 *
        upperVolume *
        levelStrength *
        centerInfluence
    };
  });

  lowerCenterPoints.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const distanceFromCenter =
      Math.abs(
        point.x -
        centerX
      ) / halfMouthWidth;

    const centerInfluence =
      Math.max(
        0,
        1 -
        distanceFromCenter
      );

    result[index] = {
      ...point,
      y:
        point.y +
        0.0022 *
        lowerVolume *
        levelStrength *
        centerInfluence
    };
  });

  // Preserve and sharpen Cupid's bow.
  cupidBow.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const centerInfluence =
      index === 0
        ? 1
        : 0.62;

    result[index] = {
      ...point,
      y:
        point.y -
        0.0028 *
        cupidBowStrength *
        levelStrength *
        centerInfluence
    };
  });

  // Slightly define the outer vermilion border.
  upperOuter.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    result[index] = {
      ...point,
      y:
        point.y -
        0.0012 *
        borderStrength *
        levelStrength
    };
  });

  lowerOuter.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    result[index] = {
      ...point,
      y:
        point.y +
        0.0014 *
        borderStrength *
        levelStrength
    };
  });

  // Central tubercle fullness.
  [0, 13].forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    result[index] = {
      ...point,
      y:
        point.y -
        0.0024 *
        tubercleStrength *
        levelStrength
    };
  });

  const lowerTubercle =
    result[14];

  if (lowerTubercle) {
    result[14] = {
      ...lowerTubercle,
      y:
        lowerTubercle.y +
        0.0028 *
        tubercleStrength *
        levelStrength
    };
  }

  // Keep the corners controlled instead of widening them too much.
  mouthCorners.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const originalPoint =
      landmarks[index];

    result[index] = {
      ...point,

      x:
        originalPoint.x +
        (
          point.x -
          originalPoint.x
        ) * 0.45,

      y:
        point.y -
        0.0015 *
        cornerLift *
        levelStrength
    };
  });

  const tissueStrength =
    level === "natural"
      ? 0.07
      : level === "enhanced"
      ? 0.2
      : 0.13;

  const softTissue =
  applyLipSoftTissue(
    landmarks,
    result,
    tissueStrength
  );

const biomechanicalResult =
  applyLipBiomechanics(
    landmarks,
    softTissue,
    level
  );

const skinStrength =
  level === "natural"
    ? 0.2
    : level === "enhanced"
    ? 0.48
    : 0.33;

return displaceLipSkin(
  landmarks,
  biomechanicalResult,
  skinStrength
);
}
/*
=========================================================
Chin Projection
=========================================================
*/

export function warpChin(
  landmarks,
  intensity = "balanced"
){

  const amount =
    intensity === "natural"
      ? 1.03
      : intensity === "balanced"
      ? 1.08
      : 1.15;

  const chin = [
    152,
    148,
    176,
    149,
    150,
    136,
    172
  ];

  const warped =
    warpRegion(
      landmarks,
      chin,
      amount
    );

  return mergeWarp(
    landmarks,
    warped
  );
}

/*
=========================================================
Jawline Definition
=========================================================
*/

export function warpJawline(
  landmarks,
  intensity = "balanced"
) {
  if (
    !Array.isArray(landmarks) ||
    landmarks.length < 468
  ) {
    return landmarks;
  }

  const strength =
    intensity === "natural"
      ? 0.012
      : intensity === "balanced"
      ? 0.022
      : 0.035;

  const result = landmarks.map(
    (landmark) => ({
      ...landmark
    })
  );

  /*
   * MediaPipe face-outline points running from the
   * left jaw toward the chin and back up the right jaw.
   */
  const leftJaw = [
    234,
    93,
    132,
    58,
    172,
    136,
    150,
    149,
    176,
    148
  ];

  const rightJaw = [
    454,
    323,
    361,
    288,
    397,
    365,
    379,
    378,
    400,
    377
  ];

  /*
   * Points near the lower chin are moved less than the
   * outer jaw so the face does not look unnaturally wide.
   */
  const leftWeights = [
    1,
    0.95,
    0.9,
    0.82,
    0.72,
    0.62,
    0.48,
    0.35,
    0.2,
    0.08
  ];

  const rightWeights = [
    1,
    0.95,
    0.9,
    0.82,
    0.72,
    0.62,
    0.48,
    0.35,
    0.2,
    0.08
  ];

  leftJaw.forEach((index, position) => {
    const landmark = result[index];

    if (!landmark) {
      return;
    }

    result[index] = {
      ...landmark,
      x:
        landmark.x -
        strength * leftWeights[position]
    };
  });

  rightJaw.forEach((index, position) => {
    const landmark = result[index];

    if (!landmark) {
      return;
    }

    result[index] = {
      ...landmark,
      x:
        landmark.x +
        strength * rightWeights[position]
    };
  });

  /*
   * Slightly lower the central chin to create a cleaner
   * jaw-to-chin transition.
   */
  const chinVerticalStrength =
    intensity === "natural"
      ? 0.003
      : intensity === "balanced"
      ? 0.006
      : 0.009;

  const chinPoints = [
    152,
    148,
    176,
    377,
    400
  ];

  chinPoints.forEach((index) => {
    const landmark = result[index];

    if (!landmark) {
      return;
    }

    result[index] = {
      ...landmark,
      y:
        landmark.y +
        chinVerticalStrength
    };
  });

  return result;
}

/*
=========================================================
Cheek Volume
=========================================================
*/

export function warpCheeks(
  landmarks,
  intensity="balanced"
){

  const amount =
    intensity === "natural"
      ? 1.04
      : intensity === "balanced"
      ? 1.09
      : 1.16;

  const leftCheek=[
    234,93,132,58
  ];

  const rightCheek=[
    454,323,361,288
  ];

  const left=
    warpRegion(
      landmarks,
      leftCheek,
      amount
    );

  const right=
    warpRegion(
      landmarks,
      rightCheek,
      amount
    );

  return mergeWarp(
    mergeWarp(
      landmarks,
      left
    ),
    right
  );
}
