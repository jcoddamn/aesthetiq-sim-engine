// ==========================================================
// AESTHETIQ
// Lip Anatomy Engine
// ==========================================================

export function getLipProfile(landmarks) {

  if (!landmarks || landmarks.length < 468) {
    return {
      upperRatio: 0.45,
      lowerRatio: 0.55,
      fullness: 0.5,
      cupidStrength: 0.5,
      philtrumLength: 0.5
    };
  }

  // MediaPipe indexes
  const upper = landmarks[13];
  const lower = landmarks[14];

  const leftCorner = landmarks[61];
  const rightCorner = landmarks[291];

  const cupid = landmarks[0];

  const lipHeight =
    Math.abs(lower.y - upper.y);

  const lipWidth =
    Math.abs(rightCorner.x - leftCorner.x);

  const fullness =
    lipHeight / lipWidth;

  return {

    upperRatio:
      0.42,

    lowerRatio:
      0.58,

    fullness,

    cupidStrength:
      Math.min(
        1,
        fullness * 6
      ),

    philtrumLength:
      Math.abs(
        cupid.y -
        upper.y
      )

  };

}
