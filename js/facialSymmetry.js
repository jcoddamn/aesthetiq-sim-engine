// =========================================================
// AESTHETIQ
// FACIAL SYMMETRY ENGINE
// =========================================================

function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

export function calculateFacialSymmetry(
  landmarks
) {
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  const noseTip = landmarks[1];
  const chin = landmarks[152];

  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];

  const eyeCenterX =
    (leftEye.x + rightEye.x) / 2;

  const mouthCenterX =
    (leftMouth.x + rightMouth.x) / 2;

  const faceMidline =
    (eyeCenterX + noseTip.x + chin.x) / 3;

  const mouthOffset =
    mouthCenterX - faceMidline;

  const noseOffset =
    noseTip.x - faceMidline;

  const chinOffset =
    chin.x - faceMidline;

  const eyeLevelDifference =
    Math.abs(
      leftEye.y - rightEye.y
    );

  const mouthLevelDifference =
    Math.abs(
      leftMouth.y - rightMouth.y
    );

  const symmetryScore =
    Math.max(
      0,
      1 -
      (
        Math.abs(mouthOffset) * 6 +
        Math.abs(noseOffset) * 6 +
        Math.abs(chinOffset) * 6 +
        eyeLevelDifference * 3 +
        mouthLevelDifference * 3
      )
    );

  return {

    symmetryScore,

    faceMidline,

    mouthOffset,

    noseOffset,

    chinOffset,

    eyeLevelDifference,

    mouthLevelDifference

  };

}
