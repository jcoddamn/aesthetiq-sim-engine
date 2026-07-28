// =========================================================
// AESTHETIQ ANATOMY PROFILE
// =========================================================

export function buildAnatomyProfile(captures) {
  const straight = captures?.straight?.landmarks;

  if (!straight) {
    return {
      anatomyStrength: 1,
      projectionStrength: 1,
      symmetryStrength: 1,
      chinStrength: 1
    };
  }

  const leftCheek = straight[234];
  const rightCheek = straight[454];
  const nose = straight[1];
  const chin = straight[152];
  const forehead = straight[10];

  const faceWidth =
    Math.abs(rightCheek.x - leftCheek.x);

  const faceHeight =
    Math.abs(chin.y - forehead.y);

  const chinLength =
    Math.abs(chin.y - nose.y);

  return {
    anatomyStrength:
      Math.min(1.25, faceWidth / 0.35),

    projectionStrength:
      Math.min(1.25, faceHeight / 0.55),

    symmetryStrength:
      1,

    chinStrength:
      Math.min(1.25, chinLength / 0.30)
  };
}
