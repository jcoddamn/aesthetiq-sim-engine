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
  intensity = "balanced"
) {

  const amount =
    intensity === "natural"
      ? 1.05
      : intensity === "balanced"
      ? 1.10
      : 1.18;

  const upperLip = [
    61,185,40,39,37,0,267,269,270,409
  ];

  const lowerLip = [
    146,91,181,84,17,314,405,321,375,291
  ];

  const upper =
    warpRegion(
      landmarks,
      upperLip,
      amount
    );

  const lower =
    warpRegion(
      landmarks,
      lowerLip,
      amount
    );

  return mergeWarp(
    mergeWarp(landmarks, upper),
    lower
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
