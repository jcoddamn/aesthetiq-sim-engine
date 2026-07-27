// =========================================================
// AESTHETIQ — HEAD POSE DETECTION
// File: js/headPose.js
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

function averagePoint(
  landmarks,
  indices
) {
  let totalX = 0;
  let totalY = 0;
  let count = 0;

  indices.forEach((index) => {
    const point =
      landmarks[index];

    if (!point) {
      return;
    }

    totalX += point.x;
    totalY += point.y;
    count += 1;
  });

  if (count === 0) {
    return null;
  }

  return {
    x: totalX / count,
    y: totalY / count
  };
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

/*
 * Positive yaw means the face is turning toward
 * the user's right.
 *
 * Negative yaw means the face is turning toward
 * the user's left.
 */
export function estimateHeadPose(
  landmarks
) {
  if (
    !Array.isArray(landmarks) ||
    landmarks.length < 468
  ) {
    return {
      valid: false,
      yaw: 0,
      pitch: 0,
      roll: 0,
      pose: "unknown",
      confidence: 0
    };
  }

  const noseTip =
    landmarks[1];

  const chin =
    landmarks[152];

  const forehead =
    landmarks[10];

  const leftFaceEdge =
    averagePoint(
      landmarks,
      [
        234,
        93,
        132
      ]
    );

  const rightFaceEdge =
    averagePoint(
      landmarks,
      [
        454,
        323,
        361
      ]
    );

  const leftEye =
    averagePoint(
      landmarks,
      [
        33,
        133,
        159,
        145
      ]
    );

  const rightEye =
    averagePoint(
      landmarks,
      [
        362,
        263,
        386,
        374
      ]
    );

  if (
    !noseTip ||
    !chin ||
    !forehead ||
    !leftFaceEdge ||
    !rightFaceEdge ||
    !leftEye ||
    !rightEye
  ) {
    return {
      valid: false,
      yaw: 0,
      pitch: 0,
      roll: 0,
      pose: "unknown",
      confidence: 0
    };
  }

  const faceWidth =
    Math.max(
      0.0001,
      distance(
        leftFaceEdge,
        rightFaceEdge
      )
    );

  const leftDistance =
    Math.abs(
      noseTip.x -
      leftFaceEdge.x
    );

  const rightDistance =
    Math.abs(
      rightFaceEdge.x -
      noseTip.x
    );

  /*
   * When facing straight, the nose should sit near
   * the horizontal center between both face edges.
   */
  const yaw =
    clamp(
      (
        rightDistance -
        leftDistance
      ) / faceWidth,
      -1,
      1
    );

  const eyeCenterY =
    (
      leftEye.y +
      rightEye.y
    ) / 2;

  const faceHeight =
    Math.max(
      0.0001,
      chin.y -
      forehead.y
    );

  const expectedNoseY =
    forehead.y +
    faceHeight * 0.56;

  /*
   * Positive pitch means chin angled downward.
   * Negative pitch means chin angled upward.
   */
  const pitch =
    clamp(
      (
        noseTip.y -
        expectedNoseY
      ) / faceHeight,
      -1,
      1
    );

  /*
   * Roll measures side-to-side head tilt.
   */
  const roll =
    Math.atan2(
      rightEye.y -
      leftEye.y,
      rightEye.x -
      leftEye.x
    );

  const absoluteYaw =
    Math.abs(yaw);

  const absolutePitch =
    Math.abs(pitch);

  const absoluteRoll =
    Math.abs(roll);

  let pose =
    "transition";

  if (
    absoluteYaw <= 0.055 &&
    absolutePitch <= 0.09 &&
    absoluteRoll <= 0.09
  ) {
    pose =
      "straight";
  } else if (
    yaw <= -0.095 &&
    yaw >= -0.36 &&
    absolutePitch <= 0.12 &&
    absoluteRoll <= 0.12
  ) {
    pose =
      "left";
  } else if (
    yaw >= 0.095 &&
    yaw <= 0.36 &&
    absolutePitch <= 0.12 &&
    absoluteRoll <= 0.12
  ) {
    pose =
      "right";
  }

  const poseTarget =
    pose === "straight"
      ? 0
      : pose === "left"
      ? -0.2
      : pose === "right"
      ? 0.2
      : yaw;

  const yawDifference =
    Math.abs(
      yaw -
      poseTarget
    );

  const confidence =
    clamp(
      1 -
      yawDifference * 2.4 -
      absolutePitch * 1.8 -
      absoluteRoll * 1.4,
      0,
      1
    );

  return {
    valid: true,
    yaw,
    pitch,
    roll,
    pose,
    confidence,

    measurements: {
      faceWidth,
      faceHeight,
      noseX:
        noseTip.x,
      noseY:
        noseTip.y,
      eyeCenterY
    }
  };
}

export function getPoseInstruction(
  pose
) {
  if (pose === "straight") {
    return "Hold still and look straight ahead";
  }

  if (pose === "left") {
    return "Hold still at the left angle";
  }

  if (pose === "right") {
    return "Hold still at the right angle";
  }

  return "Move slowly into position";
}
