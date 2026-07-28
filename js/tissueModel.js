// =========================================================
// AESTHETIQ
// TISSUE MODEL
// =========================================================

export function buildTissueModel(
  anatomyProfile
) {

  const measurements =
    anatomyProfile.measurements || {};

  const symmetry =
    anatomyProfile.symmetry || {};

  return {

    elasticity:
      Math.max(
        0.7,
        Math.min(
          1.3,
          anatomyProfile.anatomyStrength || 1
        )
      ),

    projectionResistance:
      Math.max(
        0.7,
        Math.min(
          1.3,
          anatomyProfile.projectionStrength || 1
        )
      ),

    skinMobility:
      Math.max(
        0.7,
        Math.min(
          1.3,
          measurements.faceHeight
            ? measurements.faceHeight / 0.18
            : 1
        )
      ),

    symmetryResistance:
      symmetry.symmetryScore || 1

  };

}
