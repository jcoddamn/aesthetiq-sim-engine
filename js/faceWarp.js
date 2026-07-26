import {
  getLipIntensityProfile
} from "./lipProfiles.js";

import {
  applyLipSoftTissue
} from "./lipSoftTissue.js";

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
    getLipIntensityProfile(level);

  const result = landmarks.map(
    (landmark) => ({
      ...landmark
    })
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

  const cupidBow = [
    37,
    0,
    267,
    13
  ];

  const mouthCorners = [
    61,
    291
  ];

  const centralTubercle = [
    0,
    13,
    14
  ];

  const leftCorner =
    result[61];

  const rightCorner =
    result[291];

  const upperCenter =
    result[13];

  const lowerCenter =
    result[14];

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

  function moveLipGroup(
    indices,
    verticalDirection,
    verticalAmount,
    horizontalAmount
  ) {
    indices.forEach((index) => {
      const point =
        result[index];

      if (!point) {
        return;
      }

      const sideDirection =
        point.x < centerX
          ? -1
          : 1;

      const horizontalWeight =
        Math.min(
          1,
          Math.abs(
            point.x -
            centerX
          ) / halfMouthWidth
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
          verticalAmount
      };
    });
  }

  moveLipGroup(
    upperOuter,
    -1,
    0.009 * profile.upperVolume,
    0.006 * profile.horizontalVolume
  );

  moveLipGroup(
    upperInner,
    -1,
    0.006 * profile.upperVolume,
    0.004 * profile.horizontalVolume
  );

  moveLipGroup(
    lowerOuter,
    1,
    0.0105 * profile.lowerVolume,
    0.006 * profile.horizontalVolume
  );

  moveLipGroup(
    lowerInner,
    1,
    0.007 * profile.lowerVolume,
    0.004 * profile.horizontalVolume
  );

  cupidBow.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    result[index] = {
      ...point,
      y:
        point.y -
        0.004 *
        profile.cupidBow
    };
  });

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
        0.002 *
        profile.border
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
        0.002 *
        profile.border
    };
  });

  centralTubercle.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    const direction =
      index === 14
        ? 1
        : -1;

    result[index] = {
      ...point,
      y:
        point.y +
        direction *
        0.0035 *
        profile.centralTubercle
    };
  });

    mouthCorners.forEach((index) => {
    const point =
      result[index];

    if (!point) {
      return;
    }

    result[index] = {
      ...point,
      y:
        point.y -
        0.0025 *
        profile.cornerLift
    };
  });
  
  const blendedResult =
  applyLipSoftTissue(
    landmarks,
    result,
    level === "natural"
      ? 0.22
      : level === "balanced"
      ? 0.35
      : 0.48
  );

return blendedResult;
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
